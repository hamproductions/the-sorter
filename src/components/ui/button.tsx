import { forwardRef } from 'react';
import { Spinner } from './spinner';
import { Button as StyledButton, type ButtonProps as StyledButtonProps } from './styled/button';
import { Center, styled } from 'styled-system/jsx';

interface ButtonLoadingProps {
  loading?: boolean;
  loadingText?: React.ReactNode;
}

export interface ButtonProps extends StyledButtonProps, ButtonLoadingProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { loading, disabled, loadingText, children, ...rest } = props;

  const trulyDisabled = loading || disabled;

  return (
    <StyledButton disabled={trulyDisabled} ref={ref} {...rest}>
      {loading && !loadingText ? (
        <>
          <ButtonSpinner />
          <styled.span opacity={0}>{children}</styled.span>
        </>
      ) : loadingText ? (
        loadingText
      ) : (
        children
      )}
    </StyledButton>
  );
});

Button.displayName = 'Button';

function ButtonSpinner() {
  return (
    <Center inline position="absolute" insetStart="50%" top="50%" transform="translate(-50%, -50%)">
      <Spinner
        borderRightColor="fg.disabled"
        borderTopColor="fg.disabled"
        borderWidth="1.5px"
        width="1.1em"
        height="1.1em"
      />
    </Center>
  );
}
