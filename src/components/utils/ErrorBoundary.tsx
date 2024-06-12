import React, { ErrorInfo } from 'react';
import { FaArrowsRotate, FaCopy } from 'react-icons/fa6';
import { Center, Stack, Wrap } from 'styled-system/jsx';
import { Button } from '../ui/button';
import { Code } from '../ui/code';
import { Link } from '../ui/link';
import { Text } from '../ui/text';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error; info?: ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error: Error, info: ErrorInfo) {
    // Update state so the next render will show the fallback UI.
    return { error, info };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
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
            <Text fontSize="2xl">Oopsie</Text>
            <Text>
              Sometimes refreshing the page fix it, if it doesn't ping{' '}
              <Link href="https://discordapp.com/users/260776161032798208" target="_blank">
                @hamp on Discord
              </Link>{' '}
              to fix it
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
                Copy Error Message
              </Button>
              <Button onClick={() => window.location.reload()}>
                <FaArrowsRotate />
                Reload Page
              </Button>
            </Wrap>
          </Stack>
        </Center>
      );
    }
    return this.props.children;
  }
}
