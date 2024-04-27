export const assetsURL = import.meta.env.BASE_URL + 'assets/';

export const getPicUrl = (id: string, isSeiyuu: boolean) => {
  return (
    import.meta.env.BASE_URL + (isSeiyuu ? '/assets/seiyuu/' : '/assets/character/') + `${id}.webp`
  );
};
