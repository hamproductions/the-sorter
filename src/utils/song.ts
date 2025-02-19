import type { HasuSong } from '~/types/songs';

export const getSongColor = (song: HasuSong) => {
  switch (song.unit) {
    case 'スリーズブーケ':
      return 'rgb(229,162,193)';
    case 'DOLLCHESTRA':
      return 'rgb(20,48,139)';
    case 'みらくらぱーく!':
      return 'rgb(246,211,75)';
    default:
      return '#fb8a9b';
  }
};
