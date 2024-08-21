import type { Assign } from '@ark-ui/react';
import {
  NumberInput as ArkNumberInput,
  type NumberInputRootProps
} from '@ark-ui/react/number-input';
import { forwardRef } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa6';
import { css, cx } from 'styled-system/css';
import { splitCssProps } from 'styled-system/jsx';
import { type NumberInputVariantProps, numberInput } from 'styled-system/recipes';
import type { JsxStyleProps } from 'styled-system/types';

export interface NumberInputProps
  extends Assign<JsxStyleProps, NumberInputRootProps>,
    NumberInputVariantProps {}

export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>((props, ref) => {
  const [variantProps, numberInputProps] = numberInput.splitVariantProps(props);
  const [cssProps, localProps] = splitCssProps(numberInputProps);
  const { children, className, ...rootProps } = localProps;
  const styles = numberInput(variantProps);

  return (
    <ArkNumberInput.Root
      className={cx(styles.root, css(cssProps), className)}
      ref={ref}
      {...rootProps}
    >
      {children && <ArkNumberInput.Label className={styles.label}>{children}</ArkNumberInput.Label>}
      <ArkNumberInput.Control className={styles.control}>
        <ArkNumberInput.Input className={styles.input} />
        <ArkNumberInput.IncrementTrigger className={styles.incrementTrigger}>
          <FaChevronUp />
        </ArkNumberInput.IncrementTrigger>
        <ArkNumberInput.DecrementTrigger className={styles.decrementTrigger}>
          <FaChevronDown />
        </ArkNumberInput.DecrementTrigger>
      </ArkNumberInput.Control>
    </ArkNumberInput.Root>
  );
});

NumberInput.displayName = 'NumberInput';
