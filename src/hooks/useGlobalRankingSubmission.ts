import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSaveStates } from './useSaveStates';
import {
  GLOBAL_RANKING_MIN_ITEMS,
  GLOBAL_RANKING_PROTOCOL,
  type SortLog,
  type SortSessionContext,
  type SubmissionPayload,
  type SubmissionStatus
} from '~/types/global-ranking';
import {
  isGlobalRankingEnabled,
  requestTicket,
  submitResult,
  withdrawResult
} from '~/utils/global-ranking';

export const CONTRIBUTE_STORAGE_KEY = 'global-ranking-contribute';

type SetLog = Dispatch<SetStateAction<SortLog | null | undefined>>;

const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() <= Date.now();

export const useGlobalRankingSubmission = ({
  log,
  setLog,
  isEnded,
  context
}: {
  log: SortLog | null | undefined;
  setLog: SetLog | undefined;
  isEnded: boolean;
  context: SortSessionContext;
}) => {
  const [contribute, setContribute] = useLocalStorage<boolean>(CONTRIBUTE_STORAGE_KEY, true);
  const inFlight = useRef<string | null>(null);
  const [busy, setBusy] = useState<'sending' | 'removing'>();
  const [withdrawFailed, setWithdrawFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const contextRef = useRef(context);
  contextRef.current = context;

  const sessionId = log?.sessionId;
  const { allSaves, setLog: setSaveLog } = useSaveStates();
  const submission = log?.submission;
  const optedOut = !!log?.optedOut;

  useEffect(() => {
    if (!sessionId) return;
    for (const save of allSaves) {
      if (save.log?.sessionId !== sessionId) continue;
      if (save.log.submission?.id === submission?.id && !!save.log.optedOut === optedOut) continue;
      setSaveLog(save.id, (l) => ({ ...l, submission, optedOut }));
    }
  }, [sessionId, submission, optedOut, allSaves, setSaveLog]);
  const isFresh = !!log && log.choices === '' && !log.context;

  useEffect(() => {
    if (!isFresh || !setLog) return;
    const snapshot = contextRef.current;
    setLog((l) => (l && l.sessionId === sessionId && !l.context ? { ...l, context: snapshot } : l));
  }, [isFresh, sessionId, setLog]);

  const needsTicket =
    isGlobalRankingEnabled &&
    !!log?.context &&
    !log.ticketRequested &&
    log.initialOrder.length >= GLOBAL_RANKING_MIN_ITEMS;
  const ticketKind = log?.context?.kind;

  useEffect(() => {
    if (!needsTicket || !setLog || !sessionId || !ticketKind) return;
    setLog((l) => (l?.sessionId === sessionId ? { ...l, ticketRequested: true } : l));
    const fetchTicket = async () => {
      const ticket = await requestTicket(ticketKind);
      if (!ticket) return;
      setLog((l) =>
        l?.sessionId === sessionId && !l.ticket
          ? { ...l, ticket: { id: ticket.ticket, expiresAt: ticket.expiresAt } }
          : l
      );
    };
    void fetchTicket();
  }, [needsTicket, sessionId, ticketKind, setLog]);

  const shouldSubmit =
    isEnded &&
    contribute !== false &&
    !log?.optedOut &&
    !!log?.context &&
    !!log.ticket &&
    !log.submission &&
    !log.submissionFailed &&
    !isExpired(log.ticket.expiresAt);
  const shouldWithdraw = contribute === false && !!log?.submission;

  useEffect(() => {
    if (!setLog || !log || !sessionId || inFlight.current === sessionId) return;
    if (shouldSubmit && log.context && log.ticket) {
      inFlight.current = sessionId;
      setBusy('sending');
      const payload: SubmissionPayload = {
        protocol: GLOBAL_RANKING_PROTOCOL,
        ticket: log.ticket.id,
        ...log.context,
        initialOrder: log.initialOrder.map(String),
        choices: log.choices
      };
      const submit = async () => {
        const res = await submitResult(payload);
        inFlight.current = null;
        setBusy(undefined);
        setLog((l) => {
          if (l?.sessionId !== sessionId) return l;
          if (res && res.status !== 'duplicate') {
            return {
              ...l,
              submission: { id: res.id, deleteToken: res.deleteToken, status: res.status }
            };
          }
          return { ...l, submissionFailed: true, submissionDuplicate: res?.status === 'duplicate' };
        });
      };
      void submit();
    } else if (shouldWithdraw && log.submission && !withdrawFailed) {
      inFlight.current = sessionId;
      setBusy('removing');
      const { id, deleteToken } = log.submission;
      const withdraw = async () => {
        const res = await withdrawResult(id, deleteToken);
        inFlight.current = null;
        setBusy(undefined);
        if (!res) {
          setWithdrawFailed(true);
          return;
        }
        setLog((l) => (l?.sessionId === sessionId ? { ...l, submission: undefined } : l));
      };
      void withdraw();
    }
  }, [shouldSubmit, shouldWithdraw, withdrawFailed, log, sessionId, setLog, retryKey]);

  const status: SubmissionStatus = busy
    ? busy
    : withdrawFailed && contribute === false && log?.submission
      ? 'failed'
      : log?.submission
        ? (log.submission.status ?? 'accepted')
        : contribute === false || log?.optedOut
          ? 'removed'
          : log?.submissionDuplicate
            ? 'duplicate'
            : log?.submissionFailed
              ? 'failed'
              : 'waiting';

  const retry = () => {
    if (!setLog || !sessionId) return;
    setWithdrawFailed(false);
    setRetryKey((k) => k + 1);
    setLog((l) =>
      l?.sessionId === sessionId && !l.submissionDuplicate ? { ...l, submissionFailed: false } : l
    );
  };

  return {
    contribute: contribute !== false && !log?.optedOut,
    status,
    retry,
    canRetry: withdrawFailed || (!!log?.ticket && !isExpired(log.ticket.expiresAt)),
    setContribute: (value: boolean) => {
      setWithdrawFailed(false);
      setContribute(value);
      if (value && log?.optedOut && setLog) {
        setLog((l) => (l && l.sessionId === sessionId ? { ...l, optedOut: false } : l));
      }
    },
    isAvailable:
      isGlobalRankingEnabled &&
      !!log?.ticket &&
      (!!log.submission || !!log.submissionFailed || !isExpired(log.ticket.expiresAt)),
    isEnabled: isGlobalRankingEnabled,
    sortContext: log?.context ?? context,
    submissionId: log?.submission?.id
  };
};
