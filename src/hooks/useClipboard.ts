import { createElement } from 'react';
import { Button } from '~/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useToaster } from '~/context/ToasterContext';

export function useClipboard() {
  const { t } = useTranslation();
  const { toast } = useToaster();

  const copy = async (write: () => Promise<void>, message: string) => {
    try {
      await write();
      toast({ description: t(message) });
      return true;
    } catch {
      toast({ type: 'error', description: t('setlistPrediction.failedToCopy') });
      return false;
    }
  };

  const copyText = (text: string | Promise<string>, message = 'toast.text_copied') => {
    if (typeof text === 'string') return copy(() => navigator.clipboard.writeText(text), message);
    void text.catch(() => {});
    return copy(() => {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        const data = text.then((value) => new Blob([value], { type: 'text/plain' }));
        void data.catch(() => {});
        return navigator.clipboard.write([new ClipboardItem({ 'text/plain': data })]);
      }
      return text.then((value) => navigator.clipboard.writeText(value));
    }, message);
  };

  const offerShare = (image: Blob) => {
    const files = [new File([image], 'll-sorted.png', { type: 'image/png' })];
    if (navigator.canShare && !navigator.canShare({ files })) return false;
    toast({
      duration: 30000,
      description: createElement(
        Button,
        {
          onClick: async () => {
            try {
              await navigator.share({ text: t('share.copy_text'), files });
            } catch (error) {
              if (error instanceof DOMException && error.name === 'AbortError') return;
              toast({ type: 'error', description: t('setlistPrediction.failedToCopy') });
            }
          }
        },
        t('results.share')
      )
    });
    return true;
  };

  const copyImage = async (makeImage: () => Promise<Blob | undefined>, allowShare = false) => {
    const canCopy = !!navigator.clipboard?.write && typeof ClipboardItem !== 'undefined';
    const canShare = allowShare && typeof navigator.share === 'function';
    if (!canCopy && !canShare) {
      toast({ type: 'error', description: t('setlistPrediction.failedToCopy') });
      return;
    }
    try {
      const image = makeImage().then((blob) => {
        if (!blob || blob.type !== 'image/png' || blob.size === 0) {
          throw new Error('Result image is unavailable');
        }
        return blob;
      });
      void image.catch(() => {});
      if (canCopy) {
        await copy(
          () =>
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': image }, { presentationStyle: 'attachment' })
            ]),
          'toast.screenshot_copied'
        );
      }
      if (canShare) {
        const blob = await image.catch(() => undefined);
        if ((!blob || !offerShare(blob)) && !canCopy) {
          toast({ type: 'error', description: t('setlistPrediction.failedToCopy') });
        }
      }
    } catch {
      toast({ type: 'error', description: t('setlistPrediction.failedToCopy') });
    }
  };

  return { copyText, copyImage };
}
