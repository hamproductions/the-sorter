import groupBy from 'lodash-es/groupBy';
import { useTranslation } from 'react-i18next';
import { Table } from '../ui/table';
import { Text } from '../ui/text';
import { CharacterIcon } from '../sorter/CharacterIcon';
import { SchoolBadge } from '../sorter/SchoolBadge';
import { getPicUrl } from '~/utils/assets';
import type { Character, WithRank } from '~/types';
import { Stack, Wrap, styled } from 'styled-system/jsx';
import { getCastName, getFullName } from '~/utils/character';
import { getSchoolName, getUnitName } from '~/utils/names';

export function RankingTable({
  characters,
  isSeiyuu,
  responsive,
  onSelectCharacter
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  responsive?: boolean;
  onSelectCharacter?: (character: WithRank<Character>) => void;
}) {
  const { t, i18n } = useTranslation();

  const lang = i18n.language;
  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header>{t('ranking')}</Table.Header>
          {isSeiyuu ? (
            <>
              <Table.Header>{t('seiyuu')}</Table.Header>
              <Table.Header>{t('character')}</Table.Header>
            </>
          ) : (
            <>
              <Table.Header>{t('character')}</Table.Header>
              <Table.Header>{t('seiyuu')}</Table.Header>
            </>
          )}
          <Table.Header hideBelow={responsive ? 'md' : undefined}>
            {t('settings.series')}・{t('settings.school')}
          </Table.Header>
          <Table.Header hideBelow={responsive ? 'md' : undefined}>
            {t('settings.units')}
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {characters.map((c, idx) => {
          const { rank, id, casts, colorCode, seriesColor, units } = c;
          const imageSize = idx === 0 ? '150px' : idx <= 3 ? '100px' : '80px';

          const fullName = getFullName(c, lang);
          const school = getSchoolName(c.school, lang);
          return (
            <Table.Row
              key={idx}
              style={{ ['--color' as 'color']: colorCode ?? (seriesColor as 'red') }}
              onClick={onSelectCharacter && (() => onSelectCharacter(c))}
              cursor="pointer"
              borderColor="var(--color)"
              borderLeft="8px solid"
            >
              <Table.Cell>{rank}</Table.Cell>
              <Table.Cell>
                <Stack alignItems="center" py="2" textAlign="center">
                  {idx < 10 && (
                    <styled.img
                      src={getPicUrl(id, isSeiyuu ? 'seiyuu' : 'character')}
                      alt={fullName}
                      style={{ maxHeight: imageSize }}
                      width="auto"
                    />
                  )}
                  <Wrap gap="1" justifyContent="center" alignItems="center">
                    <CharacterIcon locale={lang} character={c} w="auto" h="8" />
                    <Stack gap="1" alignItems="center">
                      <Text
                        layerStyle="textStroke"
                        color="var(--color)"
                        fontSize="md"
                        fontWeight="bold"
                      >
                        {isSeiyuu ? getCastName(casts[0], lang) : fullName}
                      </Text>
                      {isSeiyuu && casts[0].note && (
                        <Text fontSize="xs" textAlign="center">
                          ({casts[0].note})
                        </Text>
                      )}
                    </Stack>
                  </Wrap>
                </Stack>
              </Table.Cell>
              <Table.Cell>
                {isSeiyuu ? (
                  fullName
                ) : (
                  <Stack gap="1" alignItems="center" py="2">
                    {casts?.map((c) => {
                      return (
                        <Text key={c.seiyuu}>
                          {getCastName(c, lang)}{' '}
                          {c.note && (
                            <Text as="span" fontSize="xs">
                              ({c.note})
                            </Text>
                          )}
                        </Text>
                      );
                    })}
                  </Stack>
                )}
              </Table.Cell>
              <Table.Cell hideBelow={responsive ? 'md' : undefined}>
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <SchoolBadge locale={lang} character={c} />
                  <Text textAlign="center">{school}</Text>
                </Stack>
              </Table.Cell>
              <Table.Cell hideBelow={responsive ? 'md' : undefined}>
                <Stack gap="1" py="2">
                  {Object.values(
                    groupBy(
                      units.filter((u) => !u.name.includes(c.fullName)),
                      (u) => u.name
                    )
                  ).map((us) => {
                    const u = us[0];
                    return (
                      <Text key={u.id}>
                        {getUnitName(u.name, lang)}{' '}
                        {u.additionalInfo && (
                          <Text as="span" hideBelow={responsive ? 'lg' : undefined}>
                            ({us.map((i) => i.additionalInfo).join(',')})
                          </Text>
                        )}
                      </Text>
                    );
                  })}
                </Stack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
