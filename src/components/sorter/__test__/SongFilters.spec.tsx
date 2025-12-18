import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { SongFilters, type SongFilterType } from '../SongFilters';

// Mock DualListSelector to simplify testing
vi.mock('../DualListSelector', () => ({
  DualListSelector: (props: {
    title: string;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  }) => (
    <div data-testid={`dual-list-${props.title}`}>
      <h3>{props.title}</h3>
      <span>Selected Count: {props.selectedIds.length}</span>
      <button onClick={() => props.onSelectionChange([...props.selectedIds, '999'])}>
        Add Mock Item
      </button>
    </div>
  )
}));

// Setup i18n for testing
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        'settings.series': 'Series',
        'settings.types': 'Types',
        'settings.artists': 'Artists',
        'settings.characters': 'Characters',
        'settings.discographies': 'Discographies',
        'settings.select_all': 'Select All',
        'settings.deselect_all': 'Deselect All',
        'settings.type.group': 'Group',
        'settings.type.solo': 'Solo',
        'settings.type.unit': 'Unit',
        'common.selected': 'Selected'
      }
    }
  }
});

const mockFilters: SongFilterType = {
  series: [],
  artists: [],
  types: [],
  characters: [],
  discographies: []
};

describe('SongFilters Component', () => {
  it('renders all filter sections', () => {
    const setFilters = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <SongFilters filters={mockFilters} setFilters={setFilters} />
      </I18nextProvider>
    );

    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Types')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Discographies')).toBeInTheDocument();
  });

  it('toggles Series selection', async () => {
    const user = userEvent.setup();
    const setFilters = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <SongFilters filters={mockFilters} setFilters={setFilters} />
      </I18nextProvider>
    );

    // Assuming Series are rendered as Checkboxes with names from mock data
    // Note: Use a real serie name from your data since we are importing it.
    // 'μ's' is id 1.
    const checkbox = screen.getByLabelText("μ's");
    await user.click(checkbox);

    expect(setFilters).toHaveBeenCalled();
    // Verify the function update logic if complex, or just that it was called.
  });

  it('selects all Types', async () => {
    const user = userEvent.setup();
    const setFilters = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <SongFilters filters={mockFilters} setFilters={setFilters} />
      </I18nextProvider>
    );

    const selectAllTypes = screen.getAllByText('Select All')[1]; // 0: Series, 1: Types (order depends on layout)
    await user.click(selectAllTypes);

    expect(setFilters).toHaveBeenCalled();
  });

  it('deselects all filters', async () => {
    const user = userEvent.setup();
    const setFilters = vi.fn();
    const activeFilters = { ...mockFilters, series: ['1'] };
    render(
      <I18nextProvider i18n={i18n}>
        <SongFilters filters={activeFilters} setFilters={setFilters} />
      </I18nextProvider>
    );

    const deselectBtn = screen.getByText('Deselect All');
    await user.click(deselectBtn);

    expect(setFilters).toHaveBeenCalled();
  });
});
