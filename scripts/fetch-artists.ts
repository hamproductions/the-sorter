import { writeFile } from 'fs/promises';
import { join } from 'path';
const makeUrl = (id: number) => `
https://ll-fans.jp/_next/data/JR1AXx5vf_WPEMFwL3GZW/data/member/${id}.json?id=${id}`;

const ids = Array(68)
  .fill(undefined)
  .map((_, idx) => idx + 1);

const allData = [];

for (const id of ids) {
  const res = await fetch(makeUrl(id));
  const data = await res.json();

  allData.push(data);
}

await writeFile(join(__dirname, '../data/out.json'), JSON.stringify(allData));
