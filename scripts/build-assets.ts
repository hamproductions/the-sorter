import cast from '../data/pic-cast.json';
import chara from '../data/pic-src.json';
import webp from 'webp-converter';
import { fileTypeFromBuffer } from 'file-type';
import { writeFile } from 'fs/promises';
import { join } from 'path';

webp.grant_permission();

const getPic = async (src: string) => {
  const res = await fetch(src);
  const buffer = await res.arrayBuffer();
  const ext = await fileTypeFromBuffer(buffer);
  if (ext.ext === 'webp') return buffer;
  const webPbuffer = await webp.buffer2webpbuffer(buffer, ext?.ext, '-q 100');
  return webPbuffer;
};
for (let [idx, src] of cast.entries()) {
  const id = idx + 1;
  console.log('processing', 'cast', id);
  await writeFile(join(__dirname, '../public/assets/seiyuu/', `${id}.webp`), await getPic(src));
}

// for (let [idx, src] of chara.entries()) {
//   const id = idx + 1;
//   console.log('processing', 'character', id);
//   await writeFile(join(__dirname, '../public/assets/character/', `${id}.webp`), await getPic(src));
// }
