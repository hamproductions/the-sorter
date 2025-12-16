import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '..', 'data', 'artists-info.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Add englishName field for major groups
data.forEach((artist: any) => {
  if (artist.id === '133') {
    artist.englishName = 'Hasu no Sora Jogakuin School Idol Club';
  } else if (artist.id === '134') {
    artist.englishName = 'Cerise Bouquet';
  } else if (artist.id === '136') {
    artist.englishName = 'Miracra Park';
  } else if (artist.id === '60') {
    artist.englishName = 'Nijigasaki High School Idol Club';
  } else if (artist.id === '91') {
    artist.englishName = 'Liella!';
  } else if (artist.id === '175') {
    artist.englishName = 'Cerise Bouquet & DOLLCHESTRA & Miracra Park';
  } else if (artist.id === '188') {
    artist.englishName = 'Kahomegu Gelato';
  } else if (artist.id === '189') {
    artist.englishName = 'Hasu no Kyujitsu';
  } else if (artist.id === '190') {
    artist.englishName = 'Rurino to Yukai na Tsuduritachi';
  }
});

fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
console.log('Successfully added English names to artists-info.json');
