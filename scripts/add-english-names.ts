import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, '..', 'data', 'artists-info.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Mapping of artist IDs to English names
const englishNameMapping: Record<string, string> = {
  // ========================================
  // UNITS AND GROUPS
  // ========================================

  // μ's and subunits
  '1': 'Muse',
  '2': 'Printemps',
  '3': 'Lily white',
  '4': 'BiBi',
  '5': 'Nico Rin Pana',
  '32': 'A-RISE',

  // Aqours and subunits
  '33': 'Aqours',
  '34': 'CYaRon!',
  '35': 'AZALEA',
  '36': 'Guilty Kiss',
  '37': 'Saint Snow',
  '38': 'Saint Aqours Snow',
  '73': 'Uranohoshi Girls\' High School',
  '74': 'Chazelia Kiss',
  '116': 'YYY',

  // Nijigasaki and subunits
  '60': 'Nijigasaki High School Idol Club',
  '61': 'DiverDiva',
  '62': 'A・ZU・NA',
  '63': 'QU4RTZ',
  '99': 'R3BIRTH',
  '112': 'Nijigaku With You',
  '228': 'A.L.A.N',

  // Liella! and subunits
  '91': 'Liella!',
  '110': 'Sunny Passion',
  '160': 'CatChu!',
  '161': 'KALEIDOSCORE',
  '162': '5yncri5e!',

  // Hasunosora and subunits
  '133': 'Hasu no Sora Jogakuin School Idol Club',
  '134': 'Cerise Bouquet',
  '135': 'DOLLCHESTRA',
  '136': 'Mira-Cra Park!',
  '175': 'Cerise Bouquet & DOLLCHESTRA & Mira-Cra Park!',
  '188': 'KahoMegu♡Gelato',
  '189': 'Hasu no Kyujitsu',
  '190': 'Rurino to Yukai na Tsuduritachi',
  '201': 'Edel Note',
  '229': 'Ruri&To',
  '230': 'PRINCEε>ε>',
  '208': 'Kaho Hinoshita, Sayaka Murano, Rurino Osawa',
  '199': 'Ginko Momose, Kosuzu Kachimachi, Hime Anyoji',
  '209': 'Kozue Otomune, Tsuzuri Yugiri, Megumi Fujishima',

  // Cross-series units
  '101': 'Aqours・Nijigasaki High School Idol Club・Liella!',
  '155': 'Aqours feat. Hatsune Miku',
  '194': 'AiScReam',

  // Ikizurai-Bu!
  '213': 'Ikizurai-Bu!',

  // Takizakura / School Idol Musical
  '127': 'School Idol Musical',
  '187': 'Tsubaki Takizakura Girls\' High School Idol Club',

  // Yohane the Parhelion
  '159': 'Yohane',

  // ========================================
  // INDIVIDUAL CHARACTERS
  // ========================================

  // μ's members
  '6': 'Honoka Kosaka',
  '7': 'Eli Ayase',
  '8': 'Kotori Minami',
  '9': 'Umi Sonoda',
  '10': 'Rin Hoshizora',
  '11': 'Maki Nishikino',
  '12': 'Nozomi Tojo',
  '13': 'Hanayo Koizumi',
  '14': 'Nico Yazawa',

  // Aqours members
  '39': 'Chika Takami',
  '40': 'Riko Sakurauchi',
  '41': 'Kanan Matsuura',
  '42': 'Dia Kurosawa',
  '43': 'You Watanabe',
  '44': 'Yoshiko Tsushima',
  '45': 'Hanamaru Kunikida',
  '46': 'Mari Ohara',
  '47': 'Ruby Kurosawa',

  // Nijigasaki members
  '64': 'Ayumu Uehara',
  '65': 'Kasumi Nakasu',
  '66': 'Shizuku Osaka',
  '67': 'Karin Asaka',
  '68': 'Ai Miyashita',
  '69': 'Kanata Konoe',
  '70': 'Setsuna Yuki',
  '71': 'Emma Verde',
  '72': 'Rina Tennoji',
  '85': 'Shioriko Mifune',
  '97': 'Lanzhu Zhong',
  '98': 'Mia Taylor',
  '172': 'Yu Takasaki',

  // Liella! members
  '92': 'Kanon Shibuya',
  '93': 'Keke Tang',
  '94': 'Chisato Arashi',
  '95': 'Sumire Heanna',
  '96': 'Ren Hazuki',
  '113': 'Kinako Sakurakoji',
  '114': 'Wien Margarete',
  '117': 'Natsumi Onitsuka',
  '118': 'Mei Yoneme',
  '119': 'Shiki Wakana',
  '191': 'Tomari Onitsuka',

  // Hasunosora members
  '171': 'Sayaka Murano',
  '210': 'Kozue Otomune',
  '211': 'Tsuzuri Yugiri',
  '212': 'Megumi Fujishima',

  // School Idol Musical characters
  '205': 'Anzu Takizawa',

  // Ikizurai-Bu! members
  '214': 'Polka Takahashi',
  '215': 'Mai Azabu',
  '216': 'Rei Itsukiri',
  '217': 'Hanabi Komagata',
  '218': 'Miracle Kanazawa',
  '219': 'Noriko Chofu',
  '220': 'Yukuri Harumiya',
  '221': 'Aurora Konohana',
  '222': 'Midori Yamada',
  '223': 'Shion Sasaki',

  // ========================================
  // SCHOOL IDOL MUSICAL VOICE ACTOR GROUPS
  // ========================================
  '137': 'Yuna Sekine as Anzu Takizawa, Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze',
  '138': 'Yuna Sekine as Anzu Takizawa, Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze, Sayaka Okamura as Kyoka Takizawa',
  '139': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa',
  '140': 'Marina Horiuchi as Rurika Tsubaki, Yuki Aono as Madoka Tsubaki',
  '141': 'Yuna Sekine as Anzu Takizawa',
  '142': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa, Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze',
  '143': 'Yuki Aono as Madoka Tsubaki, Sayaka Okamura as Kyoka Takizawa',
  '144': 'Mizuki Saiba as Misuzu Wakatsuki, Sayaka Okamura as Kyoka Takizawa',
  '145': 'Mayuko Ohara, Kaede Kaneko, Mayuri Suzuki, Kanon Nakazaki, Kurumi Fujimoto, Tomoe Furusawa, Mei Morimoto, Nanaka Watanabe',
  '146': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa, Yuna Sekine as Anzu Takizawa, Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze, Yuki Aono as Madoka Tsubaki, Sayaka Okamura as Kyoka Takizawa',
  '147': 'Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze, Sayaka Okamura as Kyoka Takizawa',
  '148': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi',
  '149': 'Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze',
  '150': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa, Yuna Sekine as Anzu Takizawa',
  '151': 'Marina Horiuchi as Rurika Tsubaki',
  '152': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa, Yuna Sekine as Anzu Takizawa',
  '153': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa, Yuna Sekine as Anzu Takizawa, Sayaka Okamura as Kyoka Takizawa',
  '154': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa, Yuna Sekine as Anzu Takizawa, Mizuki Saiba as Misuzu Wakatsuki, Sana Hoshimori as Toa Kurusu, Ibuki Mita as Rena Suzuka, Ruri Aoyama as Sayaka Harukaze',
  '176': 'Marina Horiuchi as Rurika Tsubaki, Yua Nishida as Toa Kurusu, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa',
  '177': 'Yuna Sekine as Anzu Takizawa, Julia An as Yukino Hojo, Ibuki Mita as Rena Suzuka, Hirari Nishida as Sayaka Harukaze',
  '178': 'Nanami Asai as Yuzuha Sumeragi, Mizuki Saiba as Misuzu Wakatsuki',
  '179': 'Rina Koyama as Hikaru Amakusa, Hirari Nishida as Sayaka Harukaze',
  '180': 'Marina Horiuchi as Rurika Tsubaki, Yuna Sekine as Anzu Takizawa, Yuki Aono as Madoka Tsubaki, Sayaka Okamura as Kyoka Takizawa',
  '181': 'Julia An as Yukino Hojo, Yua Nishida as Toa Kurusu',
  '182': 'Nanami Asai as Yuzuha Sumeragi, Ibuki Mita as Rena Suzuka, Minami Sato as Maya Mikasa',
  '183': 'Mizuki Saiba as Misuzu Wakatsuki',
  '184': 'Marina Horiuchi as Rurika Tsubaki, Nanami Asai as Yuzuha Sumeragi, Julia An as Yukino Hojo, Rina Koyama as Hikaru Amakusa, Minami Sato as Maya Mikasa',
  '185': 'Yuna Sekine as Anzu Takizawa, Mizuki Saiba as Misuzu Wakatsuki, Yua Nishida as Toa Kurusu, Ibuki Mita as Rena Suzuka, Hirari Nishida as Sayaka Harukaze',
  '186': 'Yuki Aono as Madoka Tsubaki, Sayaka Okamura as Kyoka Takizawa',

  // ========================================
  // CHARACTER COMBINATIONS (AD-HOC GROUPS)
  // ========================================

  // μ's character combinations
  '15': 'Honoka Kosaka, Rin Hoshizora',
  '16': 'Kotori Minami, Hanayo Koizumi',
  '17': 'Nozomi Tojo, Nico Yazawa',
  '18': 'Eli Ayase, Umi Sonoda, Maki Nishikino',
  '19': 'Honoka Kosaka, Kotori Minami, Umi Sonoda',
  '20': 'Rin Hoshizora, Maki Nishikino, Hanayo Koizumi',
  '21': 'Eli Ayase, Nozomi Tojo, Nico Yazawa',
  '23': 'Honoka Kosaka, Kotori Minami, Umi Sonoda, Rin Hoshizora, Maki Nishikino, Hanayo Koizumi, Nico Yazawa',
  '24': 'Eli Ayase, Rin Hoshizora, Maki Nishikino, Nozomi Tojo, Hanayo Koizumi, Nico Yazawa',
  '25': 'Kotori Minami, Umi Sonoda',
  '26': 'Rin Hoshizora, Maki Nishikino',
  '27': 'Eli Ayase, Nozomi Tojo',
  '28': 'Maki Nishikino, Nico Yazawa',
  '29': 'Eli Ayase, Umi Sonoda',
  '30': 'Eli Ayase, Maki Nishikino, Nozomi Tojo',

  // Aqours character combinations
  '48': 'Riko Sakurauchi, Hanamaru Kunikida, Mari Ohara',
  '49': 'Dia Kurosawa, Ruby Kurosawa',
  '50': 'You Watanabe, Yoshiko Tsushima',
  '51': 'Chika Takami, Kanan Matsuura',
  '52': 'Chika Takami, Riko Sakurauchi, You Watanabe',
  '53': 'Yoshiko Tsushima, Hanamaru Kunikida, Ruby Kurosawa',
  '54': 'Kanan Matsuura, Dia Kurosawa, Mari Ohara',
  '55': 'Chika Takami, Riko Sakurauchi, You Watanabe, Yoshiko Tsushima, Hanamaru Kunikida, Ruby Kurosawa',
  '56': 'Chika Takami, Kanan Matsuura, Dia Kurosawa, You Watanabe, Yoshiko Tsushima, Hanamaru Kunikida, Mari Ohara, Ruby Kurosawa',
  '57': 'Hanamaru Kunikida, Ruby Kurosawa',
  '58': 'Chika Takami, Riko Sakurauchi',
  '59': 'Riko Sakurauchi, Yoshiko Tsushima',
  '88': 'Kanan Matsuura, Mari Ohara',
  '89': 'Riko Sakurauchi, You Watanabe',
  '90': 'Chika Takami, Dia Kurosawa, Yoshiko Tsushima',

  // Nijigasaki character combinations
  '129': 'Kasumi Nakasu, Shizuku Osaka, Rina Tennoji, Shioriko Mifune, Yu Takasaki',
  '130': 'Ayumu Uehara, Ai Miyashita, Setsuna Yuki, Lanzhu Zhong, Yu Takasaki',
  '131': 'Karin Asaka, Kanata Konoe, Emma Verde, Mia Taylor, Yu Takasaki',
  '157': 'Kasumi Nakasu, Shizuku Osaka, Rina Tennoji, Shioriko Mifune',
  '198': 'Ayumu Uehara, Ai Miyashita, Lanzhu Zhong, Setsuna Yuki',
  '232': 'Rina Tennoji, Shioriko Mifune',
  '233': 'Ayumu Uehara, Karin Asaka',
  '234': 'Mia Taylor, Setsuna Yuki',
  '235': 'Ai Miyashita, Lanzhu Zhong',
  '236': 'Shizuku Osaka, Kanata Konoe',
  '237': 'Kasumi Nakasu, Emma Verde',

  // Liella! character combinations
  '100': 'Kanon Shibuya, Keke Tang',
  '103': 'Kanon Shibuya, Keke Tang, Chisato Arashi, Sumire Heanna',
  '104': 'Keke Tang, Chisato Arashi, Sumire Heanna, Ren Hazuki',
  '105': 'Keke Tang, Sumire Heanna',
  '106': 'Keke Tang, Ren Hazuki',
  '107': 'Keke Tang, Sumire Heanna, Ren Hazuki',
  '108': 'Kanon Shibuya, Chisato Arashi',
  '109': 'Kanon Shibuya, Chisato Arashi, Sumire Heanna',
  '120': 'Kanon Shibuya, Keke Tang, Chisato Arashi, Sumire Heanna, Ren Hazuki, Kinako Sakurakoji',
  '121': 'Mei Yoneme, Shiki Wakana',
  '122': 'Kinako Sakurakoji, Mei Yoneme, Shiki Wakana, Natsumi Onitsuka',
  '158': 'Kanon Shibuya, Keke Tang, Chisato Arashi, Sumire Heanna, Ren Hazuki',
  '193': 'Kanon Shibuya, Wien Margarete, Tomari Onitsuka',
  '195': 'Kanon Shibuya, Keke Tang, Chisato Arashi, Sumire Heanna, Ren Hazuki, Kinako Sakurakoji, Mei Yoneme, Shiki Wakana, Natsumi Onitsuka, Wien Margarete, Tomari Onitsuka',
  '197': 'Wien Margarete, Tomari Onitsuka',
  '200': 'Ren Hazuki, Kinako Sakurakoji',
  '202': 'Kanon Shibuya, Chisato Arashi, Ren Hazuki, Natsumi Onitsuka, Wien Margarete',
  '203': 'Keke Tang, Sumire Heanna, Kinako Sakurakoji, Tomari Onitsuka',
  '231': 'Kinako Sakurakoji, Mei Yoneme, Shiki Wakana, Natsumi Onitsuka, Wien Margarete, Tomari Onitsuka',

  // Cross-series combinations
  '192': 'Honoka Kosaka, You Watanabe, Ayumu Uehara, Kanon Shibuya, Kaho Hinoshita',

  // Yohane the Parhelion character combinations
  '163': 'Dia, Ruby, Chika',
  '164': 'Hanamaru, You, Kanan',
  '165': 'Yohane, Riko, Mari',
  '166': 'Yohane, Hanamaru, Dia, Ruby, Chika, You, Kanan, Riko, Mari',
  '167': 'Yohane, Hanamaru',
  '169': 'Dia, Mari',
  '170': 'Chika, You, Kanan',
  '173': 'Ruby, Riko',
  '174': 'Yohane, Lailaps, Hanamaru, Dia, Ruby, Chika, You, Kanan, Riko, Mari',
  '196': 'Yohane, Lailaps',
};

// Export the mapping for use in tests
export { englishNameMapping };

// Only run the script if executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Add englishName field for groups
  data.forEach((artist: any) => {
    if (englishNameMapping[artist.id]) {
      artist.englishName = englishNameMapping[artist.id];
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
  console.log('Successfully added English names to artists-info.json');
}
