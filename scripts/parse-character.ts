import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
const data = JSON.parse(await readFile(join(__dirname, '../data/out.json'), 'utf-8'));

const mappedData = data.map((d) => {
  const {
    id,
    series: { id: seriesId, name: series, color: seriesColor },
    school: { name: school },
    colorName,
    colorCode,
    character: {
      fullName,
      characterCasts: {
        0: {
          title: castTitle,
          cast: { fullName: seiyuu }
        }
      },
      artistConfigurations
    },
    birthMonth,
    birthDay,
    memberProfiles
  } = d.pageProps.member;
  return {
    id,
    seriesId,
    series,
    seriesColor,
    school,
    colorName,
    colorCode,
    fullName,
    castTitle,
    seiyuu,
    units: artistConfigurations.map((a) => {
      const { artist } = a;
      return {
        name: artist.name,
        id: artist.id,
        additionalInfo: a.name
      };
    }),
    birthMonth,
    birthDay,
    profile: memberProfiles.map((p) => {
      return `${p.memberProfileItem.name}: ${p.content}`;
    })
  };
});

await writeFile(join(__dirname, '../data/character-info.json'), JSON.stringify(mappedData));
