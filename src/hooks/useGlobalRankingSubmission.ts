import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  GLOBAL_RANKING_MIN_ITEMS,
  GLOBAL_RANKING_PROTOCOL,
  type SortLog,
  type SortSessionContext,
  type SubmissionPayload
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
  const contextRef = useRef(context);
  contextRef.current = context;

  const sessionId = log?.sessionId;
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
        setLog((l) => {
          if (l?.sessionId !== sessionId) return l;
          if (res && res.status !== 'duplicate') {
            return { ...l, submission: { id: res.id, deleteToken: res.deleteToken } };
          }
          return { ...l, submissionFailed: true };
        });
      };
      void submit();
    } else if (shouldWithdraw && log.submission) {
      inFlight.current = sessionId;
      const { id, deleteToken } = log.submission;
      const withdraw = async () => {
        const res = await withdrawResult(id, deleteToken);
        inFlight.current = null;
        if (!res) return;
        setLog((l) => (l?.sessionId === sessionId ? { ...l, submission: undefined } : l));
      };
      void withdraw();
    }
  }, [shouldSubmit, shouldWithdraw, log, sessionId, setLog]);

  return {
    contribute: contribute !== false,
    setContribute: (value: boolean) => setContribute(value),
    isAvailable: isGlobalRankingEnabled && !!log?.ticket && !log.submissionFailed,
    isEnabled: isGlobalRankingEnabled,
    sortContext: log?.context ?? context
  };
};
