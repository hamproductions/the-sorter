export const Metadata = () => {
  const title = 'Yet Another LL! Sorter V1.0';
  const description = 'ヒトリダケナンテエラベナイヨー';
  const siteName = 'LL! Sorter';
  const url = 'https://hamproductions.github.io/the-sorter/';

  return (
    <>
      {/* <link rel="icon" type="image/svg+xml" href="/vite.svg" /> */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="twitter:title" content={title} />

      <meta property="og:site_name" content={siteName} />

      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />

      <meta property="og:description" content={description} />
      <meta name="description" content={description} />
      <meta name="twitter:description" content={description} />

      {/* <meta property="og:image" content={image} /> */}
      {/* <meta name="twitter:image:src" content={image} /> */}
    </>
  );
};
