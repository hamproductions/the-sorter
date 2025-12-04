import { useEffect, useState } from 'react';

export const useDialogData = <T>() => {
  const [_data, setData] = useState<T>();
  const [displayData, _setDisplayData] = useState<T>();
  const [isOpen, _setOpen] = useState<boolean>();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (_data === undefined) {
      _setOpen(false);
      timeoutId = setTimeout(() => {
        _setDisplayData(undefined);
      }, 200);
    } else {
      _setDisplayData(_data);
      _setOpen(true);
    }
    return () => clearTimeout(timeoutId);
  }, [_data]);

  return {
    data: displayData,
    isOpen,
    setData
  };
};
