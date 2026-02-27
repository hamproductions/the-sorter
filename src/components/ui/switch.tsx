import { forwardRef, type KeyboardEvent } from 'react';
import * as StyledSwitch from './styled/switch';

export type SwitchProps = StyledSwitch.RootProps;

export const Switch = forwardRef<HTMLLabelElement, SwitchProps>((props, ref) => {
  const { children, ...rootProps } = props;

  return (
    <StyledSwitch.Root ref={ref} {...rootProps}>
      <StyledSwitch.Control
        _focusVisible={{
          outlineOffset: '2px',
          outline: '2px solid',
          outlineColor: 'border.outline'
        }}
      >
        <StyledSwitch.Thumb />
      </StyledSwitch.Control>
      {children && <StyledSwitch.Label>{children}</StyledSwitch.Label>}
      <StyledSwitch.HiddenInput
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.currentTarget.click();
          }
        }}
      />
    </StyledSwitch.Root>
  );
});

Switch.displayName = 'Switch';
