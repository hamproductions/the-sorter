import { useEffect, useState } from 'react';

export const useDialogData = <T>() => {
  const [_data, setData] = useState<T>();
  const [displayData, _setDisplayData] = useState<T>();
  const [isOpen, _setOpen] = useState<boolean>();

  useEffect(() => {
    if (_data === undefined) {
      _setOpen(false);
      setTimeout(() => {
        _setDisplayData(undefined);
      }, 200);
    } else {
      _setDisplayData(_data);

      setTimeout(() => _setOpen(true), 50);
    }
  }, [_data]);

  return {
    data: displayData,
    isOpen,
    setData
  };
};
