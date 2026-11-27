export interface CopyOption {
  id: string;
  label: string;
  getPreview: () => string;
  onCopy: () => Promise<boolean>;
}

export interface CopyGroup {
  id: string;
  label?: string;
  options: CopyOption[];
}

export const getCopyOptions = (
  id: string,
  [fullLabel, shortLabel]: [string, string],
  getText: (abbreviate: boolean) => string,
  copy: (abbreviate: boolean) => Promise<boolean>
): CopyOption[] =>
  [false, true].map((abbreviate) => ({
    id: `${id}-${abbreviate ? 'short' : 'full'}`,
    label: abbreviate ? shortLabel : fullLabel,
    getPreview: () => getText(abbreviate),
    onCopy: () => copy(abbreviate)
  }));
