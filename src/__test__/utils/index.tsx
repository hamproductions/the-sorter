import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { ColorModeProvider } from '~/context/ColorModeContext';
import { ToasterProvider } from '~/context/ToasterContext';
import { Layout } from '~/pages/+Layout';

import '../../i18n';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <ColorModeProvider>
        <ToasterProvider>
          <Layout>{children}</Layout>
        </ToasterProvider>
      </ColorModeProvider>
    </HelmetProvider>
  );
}

const customRender = async (ui: React.ReactNode, options?: RenderOptions) => {
  const user = userEvent.setup();
  const res = render(ui, { wrapper: AllTheProviders, ...options });
  await user.click(await res.findByText('English'));
  return [res, user] as const;
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
