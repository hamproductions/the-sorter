import { Outlet } from '@remix-run/react';
import React from 'react';

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        {/* <!-- <link rel="icon" type="image/svg+xml" href="/vite.svg" /> --> */}
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
        {/* <!-- <meta property="og:image" content={image} />
          <meta name="twitter:image:src" content={image} /> --> */}
        <script
          type="text/partytown"
          src="https://www.googletagmanager.com/gtag/js?id=G-GWEPPCT889"
        ></script>

        <script type="text/partytown"></script>
      </head>
      <body>
        <div id="root">
          <Outlet />
        </div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  );
}
