'use client';
import { Portal } from '@ark-ui/react/portal';
import { Toaster as ArkToaster, createToaster, Toast, useToastContext } from '@ark-ui/react/toast';
import { FaCircleCheck, FaCircleExclamation, FaCircleXmark } from 'react-icons/fa6';
import { forwardRef } from 'react';
import { createStyleContext, Stack, styled } from 'styled-system/jsx';
import { toast } from 'styled-system/recipes';
import { CloseButton } from './close-button';
import { Icon, type IconProps } from './icon';
import { Spinner } from './spinner';

const { withProvider, withContext } = createStyleContext(toast);

export const Root = withProvider(Toast.Root, 'root');
export const Title = withContext(Toast.Title, 'title');
export const Description = withContext(Toast.Description, 'description');
export const ActionTrigger = withContext(Toast.ActionTrigger, 'actionTrigger');
export const CloseTrigger = withContext(Toast.CloseTrigger, 'closeTrigger');
export const StyledToaster = styled(ArkToaster);

const iconMap: Record<string, React.ElementType> = {
  warning: FaCircleExclamation,
  success: FaCircleCheck,
  error: FaCircleXmark
};

export const Indicator = forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  const toast = useToastContext();

  const StatusIcon = iconMap[toast.type];
  if (!StatusIcon) return null;

  return (
    <Icon ref={ref} data-type={toast.type} {...props}>
      <StatusIcon />
    </Icon>
  );
});

export const toaster = createToaster({
  placement: 'bottom-end',
  pauseOnPageIdle: true,
  overlap: true,
  max: 5
});

export const Toaster = () => {
  return (
    <Portal>
      <StyledToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
        {(toast) => (
          <Root
            style={{
              backgroundImage: (toast.meta as { backgroundImage?: string })?.backgroundImage
                ? `url(${(toast.meta as { backgroundImage?: string }).backgroundImage})`
                : undefined,
              backgroundPosition: 'center',
              backgroundSize: 'cover'
            }}
          >
            {toast.type === 'loading' ? <Spinner color="colorPalette.plain.fg" /> : <Indicator />}

            <Stack gap="3" alignItems="start">
              <Stack gap="1">
                {toast.title && <Title>{toast.title}</Title>}
                {toast.description && <Description>{toast.description}</Description>}
              </Stack>
              {toast.action && <ActionTrigger>{toast.action.label}</ActionTrigger>}
            </Stack>
            {toast.closable && (
              <CloseTrigger asChild>
                <CloseButton size="sm" />
              </CloseTrigger>
            )}
          </Root>
        )}
      </StyledToaster>
    </Portal>
  );
};

export {
  ToastContext as Context,
  type CreateToasterReturn as ToasterReturn,
  type ToastOptions
} from '@ark-ui/react/toast';
