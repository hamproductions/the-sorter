import { Metadata } from '~/components/layout/Metadata';

import { Partytown } from '@builder.io/partytown/react';

export function Head() {
  return (
    <>
      <Metadata />

      <script
        type="text/partytown"
        src="https://www.googletagmanager.com/gtag/js?id=G-GWEPPCT889"
      ></script>

      <script
        type="text/partytown"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag() {
              dataLayer.push(arguments);
          }
          gtag("js", new Date());
          gtag("config", "G-GWEPPCT889");
          `
        }}
      />
      <Partytown lib={(import.meta.env.BASE_URL ?? '') + '/~partytown/'} />
    </>
  );
}
