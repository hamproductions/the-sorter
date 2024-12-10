import { join } from 'path-browserify';

export const assetsURL = import.meta.env.PUBLIC_ENV__BASE_URL + 'assets/';

export const getAssetUrl = (path: string) => {
  return join(import.meta.env.PUBLIC_ENV__BASE_URL ?? '', path);
};
export const getPicUrl = (
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  type: 'seiyuu' | 'icons' | 'character' | 'thumbnail' | string = 'character'
) => {
  const prefix = (() => {
    switch (type) {
      case 'seiyuu':
        return 'assets/seiyuu';
      case 'icons':
        return 'assets/icons';
      case 'character':
        return 'assets/character';
      case 'thumbnail':
        return 'assets/songs/thumbnails';
      default:
        return 'assets/';
    }
  })();
  const photoId = type !== 'seiyuu' ? id.split('-')[0] : id;

  return getAssetUrl(join(prefix, `${photoId}.webp`));
};
