'use client';
import { FaXmark } from 'react-icons/fa6';
import { forwardRef } from 'react';
import { IconButton, type IconButtonProps } from './icon-button';

export interface CloseButtonProps extends IconButtonProps {}

export const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton(props, ref) {
    return (
      <IconButton variant="ghost" aria-label="Close" ref={ref} {...props}>
        {props.children ?? <FaXmark />}
      </IconButton>
    );
  }
);
