// https://vike.dev/onRenderHtml
export { onRenderHtml };

import React from 'react';
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { PageLayout } from './PageLayout';
import { Partytown } from '@builder.io/partytown/react';

async function onRenderHtml(pageContext: { Page: React.FunctionComponent }) {
  const { Page } = pageContext;
  const viewHtml = dangerouslySkipEscape(
    renderToString(
      <PageLayout>
        <Page />
      </PageLayout>
    )
  );

  const partyTownHead = dangerouslySkipEscape(
    renderToString(<Partytown lib={(import.meta.env.BASE_URL ?? '') + '/~partytown/'} />)
  );

  return escapeInject`
    <!doctype html>
    <html lang="en">
        <head>
        <meta charset="UTF-8" />
        <!-- <link rel="icon" type="image/svg+xml" href="/vite.svg" /> -->
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Yet Another LL Sorter V1.0</title>
        <meta property="og:title" content="Yet Another LL! Sorter" />
        <meta name="twitter:title" content="Yet Another LL! Sorter" />
        <meta property="og:site_name" content="LL! Sorter" />
        <link rel="canonical" href="https://hamproductions.github.io/the-sorter/" />
        <meta property="og:url" content="https://hamproductions.github.io/the-sorter/" />
        <meta property="og:description" content="ヒトリダケナンテエラベナイヨー" />
        <meta name="description" content="ヒトリダケナンテエラベナイヨー" />
        <meta name="twitter:description" content="ヒトリダケナンテエラベナイヨー" />
        <!-- <meta property="og:image" content={image} />
            <meta name="twitter:image:src" content={image} /> -->
        <script
            type="text/partytown"
            src="https://www.googletagmanager.com/gtag/js?id=G-GWEPPCT889"
        ></script>
        ${partyTownHead}
    
        <script type="text/partytown">
            window.dataLayer = window.dataLayer || [];
            function gtag() {
            dataLayer.push(arguments);
            }
            gtag("js", new Date());
            gtag("config", "G-GWEPPCT889");
        </script>
        </head>
        <body>
        <div id="root">${viewHtml}</div>
        </body>
    </html>
  `;
}
