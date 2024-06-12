import groupBy from 'lodash/groupBy';
import * as Table from '../ui/table';
import { Text } from '../ui/text';
import { SchoolBadge } from './SchoolBadge';
import { CharacterIcon } from './CharacterIcon';
import { Stack, Wrap, styled } from 'styled-system/jsx';
import { getPicUrl } from '~/utils/assets';
import { Character, WithRank } from '~/types';
export function RankingTable({
  characters,
  isSeiyuu
}: {
  characters: WithRank<Character>[];
  isSeiyuu: boolean;
}) {
  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header>No.</Table.Header>
          {isSeiyuu ? (
            <>
              <Table.Header>声優</Table.Header>
              <Table.Header>キャラクター</Table.Header>
            </>
          ) : (
            <>
              <Table.Header>キャラクター</Table.Header>
              <Table.Header>声優</Table.Header>
            </>
          )}
          <Table.Header hideBelow="md">シリーズ・学校</Table.Header>
          <Table.Header hideBelow="md">ユニット</Table.Header>
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
              <Table.Cell hideBelow="md">
                <Stack gap="1" alignItems="center" w="full" py="2">
                  <SchoolBadge character={c} />
                  <Text>{school}</Text>
                </Stack>
              </Table.Cell>
              <Table.Cell hideBelow="md">
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
                          <Text as="span" hideBelow="lg">
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
