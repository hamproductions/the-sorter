import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AgreementPanel } from '../leaderboard/AgreementPanel';
import { GlobalRankingToggle } from '../results/GlobalRankingToggle';
import { Text } from '../ui/text';
import { useGlobalRankingAvailable } from '~/hooks/useGlobalRankingAvailable';
import { useLocalStorage } from '~/hooks/useLocalStorage';
import { useSaveStates } from '~/hooks/useSaveStates';
import {
  GLOBAL_RANKING_PROTOCOL,
  type SortLog,
  type SubmissionStatus
} from '~/types/global-ranking';
import { submitResult, withdrawResult } from '~/utils/global-ranking';
import { Stack } from 'styled-system/jsx';

const isExpired = (log: SortLog) =>
  !log.ticket || new Date(log.ticket.expiresAt).getTime() <= Date.now();

export function SavedGlobalRanking({ saveId, ranking }: { saveId: string; ranking: string[][] }) {
  const { t } = useTranslation();
  const { allSaves, setLog } = useSaveStates();
  const { available } = useGlobalRankingAvailable();
  const log = allSaves.find((s) => s.id === saveId)?.log;
  const liveLogs = [
    useLocalStorage<SortLog>('sort-log'),
    useLocalStorage<SortLog>('songs-sort-log'),
    useLocalStorage<SortLog>('perf-songs-sort-log')
  ];
  const [busy, setBusy] = useState<'sending' | 'removing'>();
  const [failed, setFailed] = useState(false);

  if (!available || !log?.context) return null;
  const context = log.context;
  const updateLog = (update: (l: SortLog) => SortLog) => {
    setLog(saveId, update);
    for (const [, setLiveLog] of liveLogs) {
      setLiveLog((live) => (live?.sessionId === log.sessionId ? update(live) : live));
    }
  };
  const submission = log.submission;
  const canSubmit = !!log.ticket && !isExpired(log) && !log.submissionDuplicate;

  const status: SubmissionStatus =
    busy ??
    (submission
      ? (submission.status ?? 'accepted')
      : log.submissionDuplicate
        ? 'duplicate'
        : failed
          ? 'failed'
          : 'removed');

  const setContribute = async (value: boolean) => {
    setFailed(false);
    if (!value && submission) {
      setBusy('removing');
      const res = await withdrawResult(submission.id, submission.deleteToken);
      setBusy(undefined);
      if (res) updateLog((l) => ({ ...l, submission: undefined, optedOut: true }));
      else setFailed(true);
      return;
    }
    if (value && !submission && canSubmit && log.ticket) {
      setBusy('sending');
      const res = await submitResult({
        protocol: GLOBAL_RANKING_PROTOCOL,
        ticket: log.ticket.id,
        ...context,
        initialOrder: log.initialOrder.map(String),
        choices: log.choices
      });
      setBusy(undefined);
      if (res && res.status !== 'duplicate') {
        updateLog((l) => ({
          ...l,
          submissionFailed: false,
          optedOut: false,
          submission: { id: res.id, deleteToken: res.deleteToken, status: res.status }
        }));
      } else if (res?.status === 'duplicate') {
        updateLog((l) => ({ ...l, submissionDuplicate: true }));
      } else {
        setFailed(true);
      }
    }
  };

  return (
    <Stack data-testid="saved-global-ranking" gap="4" alignItems="center" w="full">
      {!submission && !canSubmit && !busy ? (
        <Text color="fg.muted" fontSize="sm" textAlign="center">
          {t(
            log.submissionDuplicate
              ? 'global_ranking.status_duplicate'
              : 'global_ranking.status_expired'
          )}
        </Text>
      ) : (
        <GlobalRankingToggle
          contribute={!!submission || busy === 'sending'}
          setContribute={(value) => void setContribute(value)}
          status={status}
          onRetry={() => void setContribute(!submission)}
          canRetry
        />
      )}
      <AgreementPanel
        kind={context.kind}
        mode={context.mode}
        ranking={ranking}
        submissionId={submission?.id}
      />
    </Stack>
  );
}
