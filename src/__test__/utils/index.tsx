import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { Suspense } from 'react';
import i18n from '../../i18n';
import { ColorModeProvider } from '~/context/ColorModeContext';
import { ToasterProvider } from '~/context/ToasterContext';
import { Layout } from '~/pages/+Layout';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <ColorModeProvider>
        <ToasterProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Layout>{children}</Layout>
          </Suspense>
        </ToasterProvider>
      </ColorModeProvider>
    </HelmetProvider>
  );
}

interface CustomRenderOptions extends RenderOptions {
  skipLanguageCheck?: boolean;
}

const customRender = async (ui: React.ReactNode, options?: CustomRenderOptions) => {
  const { skipLanguageCheck, ...renderOptions } = options || {};
  const res = render(ui, { wrapper: AllTheProviders, ...renderOptions });
  const user = userEvent.setup({ document: res.container.ownerDocument });

  if (!skipLanguageCheck) {
    await i18n.changeLanguage('en');
  }

  return [res, user] as const;
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
