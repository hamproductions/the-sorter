import { join } from 'path-browserify';

export const assetsURL = import.meta.env.PUBLIC_ENV__BASE_URL + 'assets/';

export const getPicUrl = (id: string, type: 'seiyuu' | 'icons' | 'character' = 'character') => {
  const prefix = (() => {
    switch (type) {
      case 'seiyuu':
        return 'assets/seiyuu';
      case 'icons':
        return 'assets/icons';
      case 'character':
        return 'assets/character';
    }
  })();
  const photoId = type !== 'seiyuu' ? id.split('-')[0] : id;
  return join(import.meta.env.PUBLIC_ENV__BASE_URL, prefix, `${photoId}.webp`);
};
