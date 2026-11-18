import { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaQrcode } from 'react-icons/fa6';
import { Button } from '~/components/ui/button';
import type { SavedSortState } from '~/types/save-state';

const SaveExportDialog = lazy(() =>
  import('./SaveExportDialog').then((m) => ({ default: m.SaveExportDialog }))
);

export function ExportCurrentSessionButton({
  getCurrentSave
}: {
  getCurrentSave: () => SavedSortState | undefined;
}) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState<SavedSortState[]>();

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          const save = getCurrentSave();
          if (save) setExporting([save]);
        }}
      >
        <FaQrcode /> {t('dialog.save_transfer.export')}
      </Button>
      <Suspense>
        <SaveExportDialog
          open={!!exporting}
          lazyMount
          unmountOnExit
          saves={exporting}
          onOpenChange={({ open }) => {
            if (!open) setExporting(undefined);
          }}
        />
      </Suspense>
    </>
  );
}
