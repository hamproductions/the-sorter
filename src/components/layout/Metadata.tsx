import { useTranslation } from 'react-i18next';
import { Fragment } from 'react';
import { Helmet } from 'react-helmet-async';

export function Metadata(props: { title?: string; helmet?: boolean }) {
  const { t } = useTranslation();
  const title = props.title ?? t('title', { titlePrefix: t('defaultTitlePrefix') });
  const description = t('description');
  const siteName = t('site_name');
  const url = 'https://hamproductions.github.io/the-sorter/';
  const Wrapper = props.helmet ? Helmet : Fragment;

  return (
    <Wrapper>
      {/* <link rel="icon" type="image/svg+xml" href="/vite.svg" /> */}
      <meta data-rh="true" name="viewport" content="width=device-width, initial-scale=1.0" />

      <title>{title}</title>
      <meta data-rh="true" property="og:title" content={title} />
      <meta data-rh="true" name="twitter:title" content={title} />

      <meta data-rh="true" property="og:site_name" content={siteName} />

      <link data-rh="true" rel="canonical" href={url} />
      <meta data-rh="true" property="og:url" content={url} />

      <meta data-rh="true" property="og:description" content={description} />
      <meta data-rh="true" name="description" content={description} />
      <meta data-rh="true" name="twitter:description" content={description} />

      {/* <meta property="og:image" content={image} /> */}
      {/* <meta name="twitter:image:src" content={image} /> */}
    </Wrapper>
  );
}
