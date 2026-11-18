import { join } from 'path-browserify';
import { useTranslation } from 'react-i18next';
import { useSaveStates } from './useSaveStates';
import { useSaveLoadContext } from '~/context/SaveLoadContext';
import type { SorterType } from '~/types/save-state';
import { SORTER_TYPE_ROUTES, autoSaveName, getSortSaveIdentity } from '~/utils/save-state';
import { createResultSave } from '~/utils/save-transfer';

type ResultSaveInput = Omit<Parameters<typeof createResultSave>[0], 'name' | 'sorterType'>;

export const useContinueFromResult = (sorterType: SorterType) => {
  const { t } = useTranslation();
  const { allSaves, importSaves } = useSaveStates();
  const { requestLoad } = useSaveLoadContext();

  return (input: ResultSaveInput) => {
    const save = createResultSave({
      ...input,
      sorterType,
      name: `${t('dialog.save_transfer.imported_prefix')} · ${autoSaveName(
        t,
        sorterType,
        new Set(input.results.flat()).size,
        input.filterSummary
      )}`
    });
    const identity = getSortSaveIdentity(save);
    const id =
      allSaves.find((s) => getSortSaveIdentity(s) === identity)?.id ?? importSaves([save])[0]?.id;
    if (!id) return;
    requestLoad(id);
    window.location.assign(join(import.meta.env.BASE_URL, SORTER_TYPE_ROUTES[sorterType]));
  };
};
