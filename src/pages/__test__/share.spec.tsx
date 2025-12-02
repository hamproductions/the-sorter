import '@testing-library/jest-dom/vitest';

import { describe, expect, it } from 'vitest';
import { render } from '../../__test__/utils';
import { Page } from '../share/+Page';

describe('Shared Page', () => {
  it('Renders', async () => {
    const [{ findByText }] = await render(<Page />);
    expect(await findByText('LoveLive! Sorter')).toBeInTheDocument();
  });

  it('Renders with URL parameters', async () => {
    // Mock URL parameters
    const searchParams = new URLSearchParams();
    searchParams.set('units', '134,135,136'); // Example unit IDs
    searchParams.set('seiyuu', 'true');
    
    // Use pushState to change the URL
    const url = `/?${searchParams.toString()}`;
    window.history.pushState({}, 'Test Page', url);

    const [{ findByText }] = await render(<Page />);
    expect(await findByText('LoveLive! Sorter')).toBeInTheDocument();
    
    // Cleanup
    window.history.pushState({}, 'Test Page', '/');
  });

  it('Renders shared results', async () => {
    const searchParams = new URLSearchParams();
    searchParams.set('data', 'invalid-data');
    
    const url = `/?${searchParams.toString()}`;
    window.history.pushState({}, 'Test Page', url);

    const [{ findByText }] = await render(<Page />);
    expect(await findByText('LoveLive! Sorter')).toBeInTheDocument();
    
    // Cleanup
    window.history.pushState({}, 'Test Page', '/');
  });
});
