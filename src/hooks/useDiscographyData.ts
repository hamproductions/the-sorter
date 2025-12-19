import discographyData from '../../data/discography-info.json';

export type Discography = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  releasedAt?: string; // YYYY-MM-DD
  seriesIds: number[];
  versions: {
    id: string;
    name: string;
    fullVersions?: string[];
    amazonUrl?: string;
    imageUrl?: string;
  }[];
  artistVariants?: { id: string }[];
  staffNames?: { id: string; name: string }[];
};

export const useDiscographyData = (): Discography[] => {
  return discographyData as Discography[];
};
