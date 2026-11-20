import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { retainAssets, snapshotAssets } from '../../../scripts/retain-assets';

let root: string;
let site: string;
let snapshot: string;

beforeEach(async () => {
  await mkdir('dogfood-output', { recursive: true });
  root = await mkdtemp(join('dogfood-output', 'asset-retention-'));
  site = join(root, 'site');
  snapshot = join(root, 'previous');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const asset = async (path: string, value: string) => {
  const file = join(site, path);
  await mkdir(join(file, '..'), { recursive: true });
  await writeFile(file, value);
};

describe('deployment asset retention', () => {
  it('keeps one previous generation without overwriting current files or accumulating older builds', async () => {
    await asset('assets/entries/entry-old.js', 'old entry');
    await asset('assets/chunks/old.js', 'old chunk');
    await asset('assets/static/old.css', 'old css');
    await asset('assets/chunks/shared.js', 'old shared');
    await asset('assets/songs/audio/old.webm', 'media');
    await snapshotAssets(site, snapshot);
    await rm(site, { recursive: true });
    await asset('assets/chunks/new.js', 'new chunk');
    await asset('assets/chunks/shared.js', 'new shared');
    await retainAssets(site, snapshot);
    expect(await readFile(join(site, 'assets/entries/entry-old.js'), 'utf8')).toBe('old entry');
    expect(await readFile(join(site, 'assets/static/old.css'), 'utf8')).toBe('old css');
    expect(await readFile(join(site, 'assets/chunks/shared.js'), 'utf8')).toBe('new shared');
    await expect(readFile(join(site, 'assets/songs/audio/old.webm'))).rejects.toThrow();
    await snapshotAssets(site, snapshot);
    await retainAssets(site, snapshot);
    await snapshotAssets(site, snapshot);
    await rm(site, { recursive: true });
    await asset('assets/chunks/latest.js', 'latest');
    await retainAssets(site, snapshot);
    expect(await readFile(join(site, 'assets/chunks/new.js'), 'utf8')).toBe('new chunk');
    await expect(readFile(join(site, 'assets/chunks/old.js'))).rejects.toThrow();
  });

  it('supports the first build and rejects paths outside compiled assets', async () => {
    expect(await snapshotAssets(site, snapshot)).toBe(0);
    await asset('assets/chunks/current.js', 'current');
    await retainAssets(site, snapshot);
    await writeFile(join(site, 'asset-manifest.json'), JSON.stringify(['../secret']));
    await expect(snapshotAssets(site, snapshot)).rejects.toThrow('Invalid asset manifest');
  });
});
