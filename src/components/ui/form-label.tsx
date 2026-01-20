import { forwardRef } from 'react';
import { HTMLStyledProps, styled } from 'styled-system/jsx';

import { formLabel, type FormLabelVariantProps } from 'styled-system/recipes';

export interface FormLabelProps extends HTMLStyledProps<'label'>, FormLabelVariantProps {}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>((props, ref) => {
  const [variantProps, localProps] = formLabel.splitVariantProps(props);
  return <styled.label ref={ref} {...localProps} className={formLabel(variantProps)} />;
});
