import { join } from 'path-browserify';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BiMenu, BiX } from 'react-icons/bi';
import { Box, Container, HStack, Stack } from 'styled-system/jsx';
import { ColorModeToggle } from '~/components/layout/ColorModeToggle';
import { Footer } from '~/components/layout/Footer';
import { LanguageToggle } from '~/components/layout/LanguageToggle';
import { Drawer } from '~/components/ui/drawer';
import { Link } from '~/components/ui/link';
import { Button } from '~/components/ui/styled/button';
import { IconButton } from '~/components/ui/styled/icon-button';
import { getAssetUrl } from '~/utils/assets';

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState(import.meta.env.BASE_URL);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, [children]);

  function NavLinks() {
    return (
      <>
        <Link
          href={join(import.meta.env.BASE_URL, '/')}
          data-active={currentPath === join(import.meta.env.BASE_URL, '/') ? true : undefined}
          onClick={() => setIsDrawerOpen(false)}
          _active={{ fontWeight: 'bold' }}
        >
          {t(`navigation.characters`)}
        </Link>
        <Link
          href={join(import.meta.env.BASE_URL, '/songs')}
          data-active={currentPath === join(import.meta.env.BASE_URL, '/songs') ? true : undefined}
          onClick={() => setIsDrawerOpen(false)}
          _active={{ fontWeight: 'bold' }}
        >
          {t(`navigation.songs`)}
        </Link>
        <Link
          href={join(import.meta.env.BASE_URL, '/hasu-music')}
          data-active={
            currentPath === join(import.meta.env.BASE_URL, '/hasu-music') ? true : undefined
          }
          onClick={() => setIsDrawerOpen(false)}
          _active={{ fontWeight: 'bold' }}
        >
          {t(`navigation.hasu-music`)}
        </Link>
        <Link
          href={join(import.meta.env.BASE_URL, '/setlist-prediction')}
          data-active={
            currentPath.startsWith(join(import.meta.env.BASE_URL, '/setlist-prediction'))
              ? true
              : undefined
          }
          onClick={() => setIsDrawerOpen(false)}
          _active={{ fontWeight: 'bold' }}
        >
          {t(`navigation.setlist-prediction`)}
        </Link>
      </>
    );
  }

  return (
    <Stack position="relative" w="full" minH="100vh" bgColor="bg.default">
      <Container zIndex="1" position="relative" flex={1} w="full" py={4} px={4}>
        <Stack>
          <HStack justifyContent="space-between" alignItems="center" w="full">
            {/* Desktop Navigation */}
            <HStack hideBelow="md">
              <NavLinks />
            </HStack>

            {/* Mobile Navigation Toggle */}
            <Box hideFrom="md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open Menu"
              >
                <BiMenu size={24} />
              </Button>
            </Box>

            <HStack hideBelow="md" justifySelf="flex-end">
              <LanguageToggle />
              <ColorModeToggle />
            </HStack>
          </HStack>
          {children}
        </Stack>
      </Container>
      <Footer />

      {/* Mobile Navigation Drawer */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={(e) => setIsDrawerOpen(e.open)}>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <HStack justifyContent="space-between" alignItems="center" w="full">
                <Drawer.Title>{t('common.menu', { defaultValue: 'Menu' })}</Drawer.Title>
                <Drawer.CloseTrigger asChild>
                  <IconButton variant="ghost" size="sm">
                    <BiX size={24} />
                  </IconButton>
                </Drawer.CloseTrigger>
              </HStack>
            </Drawer.Header>
            <Drawer.Body>
              <Stack gap={4}>
                <NavLinks />
              </Stack>
            </Drawer.Body>
            <Drawer.Footer>
              <HStack justifyContent="space-between" w="full">
                <LanguageToggle />
                <ColorModeToggle />
              </HStack>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>

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
        backgroundPosition="center"
        backgroundAttachment="fixed"
        backgroundImage="var(--bg-image)"
        backgroundSize="cover"
        opacity="0.05"
        mixBlendMode={{ base: 'darken', _dark: 'lighten' }}
        pointerEvents="none"
      />
    </Stack>
  );
}
