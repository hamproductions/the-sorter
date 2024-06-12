// https://vike.dev/onRenderHtml

import React from 'react';
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vike/server';
import { PageLayout } from './PageLayout';
import { Partytown } from '@builder.io/partytown/react';
import { Metadata } from '~/components/layout/Metadata';

export function onRenderHtml(pageContext: { Page: React.FunctionComponent }) {
  const { Page } = pageContext;
  const viewHtml = dangerouslySkipEscape(
    renderToString(
      <PageLayout>
        <Page />
      </PageLayout>
    )
  );

  const pageMeta = dangerouslySkipEscape(renderToString(<Metadata />));

  const partyTownHead = dangerouslySkipEscape(
    renderToString(<Partytown lib={(import.meta.env.BASE_URL ?? '') + '/~partytown/'} />)
  );

  return escapeInject`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${pageMeta}
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
