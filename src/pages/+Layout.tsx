import { join } from 'path-browserify';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Container, HStack, Stack } from 'styled-system/jsx';
import { ColorModeToggle } from '~/components/layout/ColorModeToggle';
import { Footer } from '~/components/layout/Footer';
import { LanguageToggle } from '~/components/layout/LanguageToggle';
import { Link } from '~/components/ui/link';
import { getAssetUrl } from '~/utils/assets';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState(import.meta.env.BASE_URL);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, [children]);

  return (
    <Stack position="relative" w="full" minH="100vh" bgColor="bg.default">
      <Container zIndex="1" position="relative" flex={1} w="full" py={4} px={4}>
        <Stack>
          <HStack
            justifyContent={{ base: 'flex-end', md: 'space-between' }}
            alignItems="center"
            w="full"
            flexWrap="wrap-reverse"
          >
            <HStack>
              <Link
                href={join(import.meta.env.BASE_URL, '/')}
                data-active={currentPath === join(import.meta.env.BASE_URL, '/') ? true : undefined}
                _active={{
                  fontWeight: 'bold'
                }}
              >
                {t(`navigation.characters`)}
              </Link>
              {/* <Link
                href={join(import.meta.env.BASE_URL, '/songs')}
                data-active={
                  currentPath === join(import.meta.env.BASE_URL, '/songs') ? true : undefined
                }
                _active={{
                  fontWeight: 'bold'
                }}
              >
                {t(`navigation.songs`)}
              </Link> */}
              <Link
                href={join(import.meta.env.BASE_URL, '/hasu-music')}
                data-active={
                  currentPath === join(import.meta.env.BASE_URL, '/hasu-music') ? true : undefined
                }
                _active={{
                  fontWeight: 'bold'
                }}
              >
                {t(`navigation.hasu-music`)}
              </Link>
            </HStack>
            <HStack justifySelf="flex-end">
              <LanguageToggle />
              <ColorModeToggle />
            </HStack>
          </HStack>
          {children}
        </Stack>
      </Container>
      <Footer />
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
        pointerEvents="none"
      />
    </Stack>
  );
}
