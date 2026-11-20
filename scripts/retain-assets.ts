import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST = 'asset-manifest.json';
const DIRECTORIES = ['assets/chunks', 'assets/entries', 'assets/static'];
const isAsset = (path: unknown): path is string =>
  typeof path === 'string' &&
  DIRECTORIES.some((directory) => path.startsWith(`${directory}/`)) &&
  /^assets\/(?:chunks|entries|static)\/[\w.-]+$/.test(path);

const listAssets = async (site: string) => {
  const paths: string[] = [];
  for (const directory of DIRECTORIES) {
    let entries;
    try {
      entries = await readdir(join(site, directory), { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of entries) {
      const path = `${directory}/${entry.name}`;
      if (entry.isFile() && isAsset(path)) paths.push(path);
    }
  }
  return paths.sort();
};

const copyAssets = async (source: string, target: string, paths: string[], overwrite: boolean) => {
  for (const path of paths) {
    await mkdir(dirname(join(target, path)), { recursive: true });
    await cp(join(source, path), join(target, path), { force: overwrite, errorOnExist: false });
  }
};

const currentAssets = async (site: string): Promise<string[]> => {
  try {
    const value: unknown = JSON.parse(await readFile(join(site, MANIFEST), 'utf8'));
    if (!Array.isArray(value) || !value.every(isAsset)) throw new Error('Invalid asset manifest');
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return listAssets(site);
  }
};

export const snapshotAssets = async (site: string, snapshot: string) => {
  const paths = await currentAssets(site);
  await rm(snapshot, { recursive: true, force: true });
  await mkdir(snapshot, { recursive: true });
  await copyAssets(site, snapshot, paths, true);
  await writeFile(join(snapshot, MANIFEST), JSON.stringify(paths));
  return paths.length;
};

export const retainAssets = async (site: string, snapshot: string) => {
  const current = await currentAssets(site);
  await writeFile(join(site, MANIFEST), JSON.stringify(current));
  const previous: unknown = JSON.parse(await readFile(join(snapshot, MANIFEST), 'utf8'));
  if (!Array.isArray(previous) || !previous.every(isAsset))
    throw new Error('Invalid asset manifest');
  await copyAssets(snapshot, site, previous, false);
  return previous.length;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, site, snapshot] = process.argv.slice(2);
  if (!site || !snapshot || !['snapshot', 'retain'].includes(mode)) {
    throw new Error('Usage: bun scripts/retain-assets.ts <snapshot|retain> <site> <snapshot>');
  }
  const count = await (mode === 'snapshot' ? snapshotAssets : retainAssets)(site, snapshot);
  console.log(`${mode}: ${count} compiled assets`);
}
