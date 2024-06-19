import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Box, Container, HStack, Stack } from 'styled-system/jsx';
import { ColorModeToggle } from '~/components/layout/ColorModeToggle';
import { Footer } from '~/components/layout/Footer';
import { LanguageToggle } from '~/components/layout/LanguageToggle';
import ErrorBoundary from '~/components/utils/ErrorBoundary';
import { ColorModeProvider } from '~/context/ColorModeContext';
import { ToasterProvider } from '~/context/ToasterContext';
import { getAssetUrl } from '~/utils/assets';

import '../i18n';
import '../index.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ColorModeProvider>
          <ToasterProvider>
            <Stack position="relative" w="full" minH="100vh" bgColor="bg.default">
              <Box
                style={{
                  ['--bg-image' as 'backgroundImage']: `url('${getAssetUrl('/assets/bg.webp')}')`
                }}
                zIndex="0"
                position="fixed"
                top="0"
                left="0"
                w="100vw"
                h="100vh"
                opacity="0.05"
                backgroundPosition="center"
                backgroundAttachment="fixed"
                backgroundImage="var(--bg-image)"
                backgroundSize="cover"
                mixBlendMode={{ base: 'darken', _dark: 'lighten' }}
              />

              <Container zIndex="1" position="relative" flex={1} w="full" py={4} px={4}>
                <Stack>
                  <HStack justifyContent="flex-end" w="full">
                    <LanguageToggle />
                    <ColorModeToggle />
                  </HStack>
                  {children}
                </Stack>
              </Container>
              <Footer />
            </Stack>
          </ToasterProvider>
        </ColorModeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
