export interface PeriodRange {
  from: string;
  to: string;
}

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;

export const monthOf = (date: Date) => date.toISOString().slice(0, 7);

export const dayOf = (date: Date) => date.toISOString().slice(0, 10);

export const parsePeriod = (period: string): PeriodRange | undefined => {
  if (period === 'all') return { from: '0000-01', to: '9999-12' };
  if (YEAR.test(period)) return { from: `${period}-01`, to: `${period}-12` };
  if (MONTH.test(period)) return { from: period, to: period };
  return undefined;
};

export const isClosedMonth = (month: string, now = new Date()) => month < monthOf(now);
