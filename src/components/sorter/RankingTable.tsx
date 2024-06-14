import groupBy from 'lodash-es/groupBy';
import { useTranslation } from 'react-i18next';
import * as Table from '../ui/table';
import { Text } from '../ui/text';
import { CharacterIcon } from './CharacterIcon';
import { SchoolBadge } from './SchoolBadge';
import { getPicUrl } from '~/utils/assets';
import { Character, WithRank } from '~/types';
import { Stack, Wrap, styled } from 'styled-system/jsx';

export function RankingTable({
  characters,
  isSeiyuu,
  responsive
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
  responsive?: boolean;
}) {
  const { t } = useTranslation();
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
          const { rank, id, fullName, casts, school, colorCode, seriesColor, units } = c;
          const imageSize = idx === 0 ? '150px' : idx <= 3 ? '100px' : '80px';
          return (
            <Table.Row
              key={idx}
              style={{ ['--color' as 'color']: colorCode ?? (seriesColor as 'red') }}
              borderLeft="8px solid"
              borderColor="var(--color)"
            >
              <Table.Cell>{rank}</Table.Cell>
              <Table.Cell>
                <Stack alignItems="center" py="2">
                  {idx < 10 && (
                    <styled.img
                      src={getPicUrl(id, isSeiyuu ? 'seiyuu' : 'character')}
                      alt={fullName}
                      style={{ maxHeight: imageSize }}
                      width="auto"
                    />
                  )}
                  <Wrap gap="1" justifyContent="center" alignItems="center">
                    <CharacterIcon character={c} w="auto" h="8" />
                    <Stack gap="1" alignItems="center">
                      <Text color="var(--color)" fontSize="md" fontWeight="bold">
                        {isSeiyuu ? casts[0].seiyuu : fullName}
                      </Text>
                      {isSeiyuu && casts[0].note && (
                        <Text textAlign="center" fontSize="xs">
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
                          {c.seiyuu}{' '}
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
                  <SchoolBadge character={c} />
                  <Text>{school}</Text>
                </Stack>
              </Table.Cell>
              <Table.Cell hideBelow={responsive ? 'md' : undefined}>
                <Stack gap="1" py="2">
                  {Object.values(
                    groupBy(
                      units.filter((u) => !u.name.includes(fullName)),
                      (u) => u.name
                    )
                  ).map((us) => {
                    const u = us[0];
                    return (
                      <Text key={u.id}>
                        {u.name}{' '}
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
