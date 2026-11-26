const places = [
  '北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山',
  '石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根',
  '岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄',
  '札幌|函館|旭川|仙台|横浜|川崎|金沢|沼津|浜松|名古屋|神戸|松山|高松|北九州',
  'ソウル|上海|台北|広州|香港'
].join('|');
const city = `(?:${places})(?:追加|ファイナル)?`;
const numerals = '一二三四五六七八九十';
const number = `([0-9０-９]+|[${numerals}])`;

const dayNumber = new RegExp(`(?<![a-z])day[.\\-]?\\s*([0-9０-９]+)|${number}日目`, 'giu');
const timeOfDay = /[＜<【]?(昼|夜)(?:公演|の部)[＞>】]?/gu;
const partNumber = new RegExp(`第?${number}部`, 'gu');
const nightNumber = new RegExp(`第${number}夜`, 'gu');
const cityShow = new RegExp(`(${city})公演`, 'gu');
const cityUnit = new RegExp(`(?<=${city})（([^（）]*)）`, 'gu');
const bracketedName = /(?<=[（(＜])[^（()）＜＞]+?(?=(?: edition)?[）)＞])/gu;
const bracketedRound = /[＜<]([^＜＞<>]*回[^＜＞<>]*)[＞>]/gu;
const cityBeforeDay = new RegExp(`(${city}|東海|関東|関西) (?=D\\d)`, 'gu');

const words = {
  ja: {
    昼: '昼',
    夜: '夜',
    part: (value: string) => `${value}部`,
    night: (value: string) => `${value}夜`
  },
  en: {
    昼: 'Day',
    夜: 'Night',
    part: (value: string) => `Part ${value}`,
    night: (value: string) => `Night ${value}`
  }
};

const toDigits = (value: string) => {
  const index = numerals.indexOf(value);
  return index < 0 ? value.normalize('NFKC') : String(index + 1);
};

const tidy = (text: string) => text.replace(/\s+/g, ' ').trim();

export const shortPerformanceLabel = (
  label: string,
  locale: 'ja' | 'en',
  shortName: (name: string) => string | undefined = () => undefined
) => {
  const word = words[locale];
  const shorten = (text: string) =>
    tidy(
      text
        .replace(dayNumber, (_, day?: string, nth?: string) => ` D${toDigits(day ?? nth!)} `)
        .replace(timeOfDay, (_, time: '昼' | '夜') => ` ${word[time]} `)
        .replace(partNumber, (_, value: string) => ` ${word.part(toDigits(value))} `)
        .replace(nightNumber, (_, value: string) => ` ${word.night(toDigits(value))} `)
        .replace(cityShow, '$1')
        .replace(cityUnit, '($1)')
        .replace(bracketedName, (name) => shortName(name) ?? name)
    );
  const parts = label.match(/^(.*) \((.*)\)$/)?.slice(1) ?? [label];
  const shortParts = parts.map(shorten);
  if (shortParts.every((part, index) => part === parts[index])) return label;
  return tidy(shortParts.join(' ').replace(bracketedRound, ' $1 '))
    .replace(/ (?=（)/g, '')
    .replace(cityBeforeDay, '$1')
    .replace(/(D\d+) (?=[昼夜])/g, '$1');
};
