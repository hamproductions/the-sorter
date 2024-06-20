import { useEffect, useState } from 'react';

export const useDialogData = <T>() => {
  const [data, setData] = useState<T>();
  const [displayData, _setDisplayData] = useState<T>();

  useEffect(() => {
    if (data === undefined) {
      setTimeout(() => _setDisplayData(undefined), 200);
    } else {
      setTimeout(() => _setDisplayData(data), 50);
    }
  }, [data]);

  return {
    data: displayData,
    isOpen: !!data,
    setData
  };
};
