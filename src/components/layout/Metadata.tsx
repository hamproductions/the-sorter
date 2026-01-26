import { useTranslation } from 'react-i18next';
import { Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { VERSION } from '../../version';
import { SITE_URL } from '~/utils/config';

export function Metadata(props: {
  title?: string;
  description?: string;
  helmet?: boolean;
  lang?: string;
  alternates?: { lang: string; href: string }[];
  canonical?: string;
  keywords?: string;
}) {
  const { t, i18n } = useTranslation();
  const title = props.title ?? t('title', { titlePrefix: t('defaultTitlePrefix') });
  const description = props.description ?? t('description');
  const siteName = t('site_name');
  const url = props.canonical ?? SITE_URL;
  const keywords = props.keywords ?? t('meta_keywords');
  const Wrapper = props.helmet ? Helmet : Fragment;

  return (
    <Wrapper>
      <html lang={props.lang ?? i18n.language} />
      {/* <link rel="icon" type="image/svg+xml" href="/vite.svg" /> */}
      <meta data-rh="true" name="viewport" content="width=device-width, initial-scale=1.0" />

      <title>{title}</title>
      <meta data-rh="true" property="og:title" content={title} />
      <meta data-rh="true" name="twitter:title" content={title} />

      <meta data-rh="true" property="og:site_name" content={siteName} />

      <link data-rh="true" rel="canonical" href={url} />
      {props.alternates?.map((alt) => (
        <link key={alt.lang} rel="alternate" href={alt.href} hreflang={alt.lang} />
      ))}
      <meta data-rh="true" property="og:url" content={url} />

      <meta data-rh="true" property="og:description" content={description} />
      <meta data-rh="true" name="description" content={description} />
      <meta data-rh="true" name="twitter:description" content={description} />
      <meta data-rh="true" name="keywords" content={keywords} />

      <meta data-rh="true" name="version" content={VERSION} />

      {/* <meta property="og:image" content={image} /> */}
      {/* <meta name="twitter:image:src" content={image} /> */}
    </Wrapper>
  );
}
