import { Partytown } from '@builder.io/partytown/react';
import { Metadata } from '~/components/layout/Metadata';
import { getAssetRecoveryScript } from '~/utils/asset-recovery-bootstrap';

export function Head() {
  return (
    <>
      <Metadata />
      <script
        dangerouslySetInnerHTML={{
          __html: getAssetRecoveryScript(
            import.meta.env.PUBLIC_ENV__BUILD_TIMESTAMP ?? 'development'
          )
        }}
      />

      {import.meta.env.PROD && (
        <>
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

          <Partytown lib={(import.meta.env.PUBLIC_ENV__BASE_URL ?? '') + '/~partytown/'} />
        </>
      )}
    </>
  );
}
