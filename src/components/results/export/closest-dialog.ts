export const getClosestDialog = (node: Element | null) =>
  node?.closest<HTMLElement>('[role="dialog"]') ?? null;
