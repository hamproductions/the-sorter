import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { groupBy } from 'lodash-es';
import * as Dialog from '../ui/dialog';
import { Button } from '../ui/button';
import { IconButton } from '../ui/icon-button';
import { LanguageToggle } from '../layout/LanguageToggle';
import { CharacterIcon } from '../sorter/CharacterIcon';
import { Text } from '../ui/text';
import { SchoolBadge } from '../sorter/SchoolBadge';
import { Heading } from '../ui/heading';
import { getPicUrl } from '~/utils/assets';
import { getCastName, getFullName } from '~/utils/character';
import { Box, Center, HStack, Stack, Wrap, styled } from 'styled-system/jsx';
import type { Character } from '~/types';
import { getUnitName } from '~/utils/filter';

export function CharacterInfoDialog(
  props: Dialog.RootProps & { character?: Character; isSeiyuu: boolean }
) {
  const { character, isSeiyuu, ...rest } = props;
  const { t, i18n } = useTranslation();

  const {
    id,
    casts,
    seriesColor,
    colorCode,
    birthMonth,
    birthDay,
    colorName,
    school,
    profile,
    units
  } = character ?? {};
  const lang = i18n.language;
  const fullName = character && getFullName(character, lang);
  const castName = casts && getCastName(casts[0], lang);

  return (
    <Dialog.Root lazyMount unmountOnExit {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner py="6" px="4">
        <Dialog.Content
          style={{
            ['--color' as 'color']: (colorCode ?? seriesColor) as 'red',
            ['--seriesColor' as 'borderLeftColor']: seriesColor ?? colorCode ?? 'unset'
          }}
          justifyContent="flex-end"
          borderTop="8px solid"
          borderColor="var(--color)"
          w="full"
          maxW="breakpoint-lg"
          h="full"
          mx="4"
        >
          {character && (
            <Stack gap="2" h="full" p="6">
              <SchoolBadge character={character} locale={lang} w="fit-content" />
              <HStack>
                <CharacterIcon locale={lang} character={character} w="12" h="12" />
                <Stack gap={0} w="full">
                  <Dialog.Title>{isSeiyuu ? castName : fullName}</Dialog.Title>
                  <Dialog.Description>{isSeiyuu ? fullName : castName}</Dialog.Description>
                </Stack>
              </HStack>
              <Box position="relative" flex="1" overflowY="auto">
                <HStack
                  position="absolute"
                  flexDirection={{ base: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems="stretch"
                  w="full"
                >
                  <Stack w="full" h="full">
                    <Heading fontSize="xl" fontWeight="bold">
                      {t('dialog.character_info.profile')}
                    </Heading>
                    <Stack gap={1}>
                      {birthDay && (
                        <Wrap gap={1}>
                          <Text fontWeight="bold">{t('dialog.character_info.birthday')}:</Text>
                          <Text>
                            {birthMonth}/{birthDay}
                          </Text>
                        </Wrap>
                      )}
                      {school && (
                        <Wrap gap={1}>
                          <Text fontWeight="bold">{t('dialog.character_info.school')}:</Text>
                          <Text>{school}</Text>
                        </Wrap>
                      )}
                      <Stack gap={1}>
                        <Text fontWeight="bold">{t('dialog.character_info.units')}:</Text>
                        {/* @ts-expect-error TODO */}
                        <Stack as="ul" gap={1} pl={4} listStyleType="disc">
                          {units &&
                            Object.values(
                              groupBy(
                                units.filter((u) => !u.name.includes(character.fullName)),
                                (u) => u.name
                              )
                            ).map((us) => {
                              const u = us[0];
                              return (
                                <Text as="li" size="sm" key={u.id}>
                                  {getUnitName(u.name, lang)}{' '}
                                  {u.additionalInfo && (
                                    <Text as="span">
                                      ({us.map((i) => i.additionalInfo).join(',')})
                                    </Text>
                                  )}
                                </Text>
                              );
                            })}
                        </Stack>
                      </Stack>
                      {colorName && (
                        <Wrap gap={1}>
                          <Text fontWeight="bold">{t('dialog.character_info.color_name')}:</Text>
                          <Text>{colorName}</Text>
                        </Wrap>
                      )}
                      {profile &&
                        profile.map((p) => {
                          const [item, value] = p.split(': ');
                          return (
                            <Wrap key={item}>
                              <Text fontWeight="bold">{item}:</Text>
                              <Text>{value}</Text>
                            </Wrap>
                          );
                        })}
                    </Stack>
                  </Stack>
                  {id && (
                    <HStack
                      flexDirection={{ md: 'column' }}
                      alignItems="stretch"
                      maxH={{ base: '240px', md: '480px' }}
                    >
                      <styled.img
                        src={getPicUrl(id, isSeiyuu ? 'seiyuu' : 'character')}
                        alt={isSeiyuu ? castName : fullName}
                        display="block"
                        flex={1}
                        objectFit="contain"
                        minW={0}
                        maxW="full"
                        minH={0}
                        maxH="full"
                      />
                      <styled.img
                        src={getPicUrl(id, isSeiyuu ? 'character' : 'seiyuu')}
                        alt={isSeiyuu ? fullName : castName}
                        display="block"
                        flex={1}
                        objectFit="contain"
                        minW={0}
                        maxW="full"
                        minH={0}
                        maxH="full"
                      />
                    </HStack>
                  )}
                </HStack>
              </Box>
              <Center>
                <LanguageToggle />
              </Center>
              <Stack gap="3" direction="row" width="full">
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline" width="full">
                    {t('dialog.close')}
                  </Button>
                </Dialog.CloseTrigger>
              </Stack>
            </Stack>
          )}
          <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
            <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
