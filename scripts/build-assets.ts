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
// for (let [idx, src] of cast.entries()) {
//   const id = idx + 1;
//   console.log('processing', 'cast', id);
//   await writeFile(join(__dirname, '../public/assets/seiyuu/', `${id}.webp`), await getPic(src));
// }

// for (let [idx, src] of chara.entries()) {
//   const id = idx + 1;
//   console.log('processing', 'character', id);
//   await writeFile(join(__dirname, '../public/assets/character/', `${id}.webp`), await getPic(src));
// }

// for (let [idx, { name, url }] of [
//   {
//     name: '58',
//     url: 'https://ogre.natalie.mu/media/news/stage/2022/0926/sim10.jpg?imwidth=750&imdensity=1'
//   },
//   {
//     name: '56',
//     url: 'https://ogre.natalie.mu/media/news/stage/2022/0926/sim08.jpg?impolicy=lt&imwidth=1200&imdensity=1'
//   }
// ].entries()) {
//   const id = idx + 13;
//   console.log('processing', 'cast', id);
//   await writeFile(join(__dirname, '../public/assets/seiyuu/', `${name}.webp`), await getPic(url));
// }

for (let [idx, src] of [
  'https://yohane.net/dist/img/character/character6/cv.webp?ver=1.74', //1
  'https://yohane.net/dist/img/character/character9/cv.webp?ver=1.74', //2
  'https://yohane.net/dist/img/character/character3/cv.webp?ver=1.74',
  'https://yohane.net/dist/img/character/character4/cv.webp?ver=1.74', //4
  'https://yohane.net/dist/img/character/character7/cv.webp?ver=1.74', //5
  'https://yohane.net/dist/img/character/character10/cv.webp?ver=1.74', //6
  'https://yohane.net/dist/img/character/character8/cv.webp?ver=1.74', //7
  'https://yohane.net/dist/img/character/character1/cv.webp?ver=1.74', //8
  'https://yohane.net/dist/img/character/character5/cv.webp?ver=1.74', //9
].entries()) {
  const id = idx + 13;
  console.log('processing', 'cast', id);
  await writeFile(join(__dirname, '../public/assets/seiyuu/', `${id}.webp`), await getPic(src));
}
