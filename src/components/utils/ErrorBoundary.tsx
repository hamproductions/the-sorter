import type { ErrorInfo } from 'react';
import React from 'react';
import { FaArrowsRotate, FaCopy, FaTrash } from 'react-icons/fa6';
import type { WithTranslation } from 'react-i18next';
import { withTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Code } from '../ui/code';
import { Link } from '../ui/link';
import { Text } from '../ui/text';
import { SentryContext } from './SentryContext';
import { Center, Stack, Wrap } from 'styled-system/jsx';
class ErrorBoundaryInner extends React.Component<
  WithTranslation & { children: React.ReactNode },
  { error?: Error; info?: ErrorInfo }
> {
  static contextType = SentryContext;

  declare context: React.ContextType<typeof SentryContext>;

  constructor(props: WithTranslation & { children: React.ReactNode }) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: Error, info: ErrorInfo) {
    // Update state so the next render will show the fallback UI.
    return { error, info };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });

    const errorBoundaryError = new Error(error.message);
    errorBoundaryError.name = `React ErrorBoundary ${error.name}`;
    errorBoundaryError.stack = info.componentStack ?? undefined;

    console.log('CAUGHT!!!', error, this.context);
    this.context?.captureException(error, {
      captureContext: {
        contexts: { react: { componentStack: info.componentStack } }
      }
    });
  }

  copyMessage() {
    const msg = this.state.error?.stack;
    if (msg) {
      void navigator.clipboard.writeText(msg);
    }
  }

  render() {
    if (!!this.state.error) {
      return (
        <Center w="100vw" minH="100vh" px="4">
          <Stack alignItems="center">
            <Text fontSize="2xl">{this.props.t('error_page.title')}</Text>
            <Text>
              {this.props.t('error_page.text')}
              <Link href="https://discordapp.com/users/260776161032798208" target="_blank">
                {this.props.t('error_page.discord_link')}
              </Link>
              {this.props.t('error_page.to_fix_it')}
            </Text>
            <Code p="4" whiteSpace="pre-wrap">
              {this.state.error.stack}
            </Code>
            {/* <Code p="4" whiteSpace="pre-wrap">
              {this.state.info?.componentStack}
            </Code> */}
            <Wrap>
              <Button variant="ghost" onClick={() => this.copyMessage()}>
                <FaCopy />
                {this.props.t('error_page.copy')}
              </Button>
              <Button onClick={() => window.location.reload()}>
                <FaArrowsRotate />
                {this.props.t('error_page.reload')}
              </Button>
              <Button
                variant="subtle"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                <FaTrash />
                {this.props.t('error_page.clear')}
              </Button>
            </Wrap>
          </Stack>
        </Center>
      );
    }
    return this.props.children;
  }
}

//@ts-expect-error TODO: wtf
export default withTranslation()(ErrorBoundaryInner);
