import { useCallback, useEffect, useState } from 'react';
import { checkGlobalRankingAvailable, isGlobalRankingEnabled } from '~/utils/global-ranking';

export const useGlobalRankingAvailable = () => {
  const [available, setAvailable] = useState<boolean | undefined>(
    isGlobalRankingEnabled ? undefined : false
  );

  useEffect(() => {
    let cancelled = false;
    void checkGlobalRankingAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recheck = useCallback(() => {
    setAvailable(undefined);
    void checkGlobalRankingAvailable(true).then(setAvailable);
  }, []);

  return { available, recheck };
};
