import { Character } from '~/types';
import { Badge } from '../ui/badge';
import * as Table from '../ui/table';
import { Text } from '../ui/text';
import { Stack, styled } from 'styled-system/jsx';

export const RankingTable = ({
  characters,
  isSeiyuu
}: {
  characters: Character[];
  isSeiyuu: boolean;
}) => {
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
          <Table.Header>シリーズ</Table.Header>
          <Table.Header>学校</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {characters.map((c, idx) => {
          const { id, fullName, casts, school, colorCode, series, seriesColor } = c;

          return (
            <Table.Row key={idx}>
              <Table.Cell>{idx + 1}</Table.Cell>
              <Table.Cell>
                <Stack alignItems="center" py="2">
                  {idx < 10 && (
                    <styled.img
                      src={(isSeiyuu ? '/assets/seiyuu/' : '/assets/character/') + `${id}.webp`}
                      width="auto"
                      maxHeight="150px"
                    />
                  )}
                  <Stack gap="1" alignItems="center">
                    <Text style={{ color: colorCode ?? undefined }} fontSize="md" fontWeight="bold">
                      {isSeiyuu ? casts[0].seiyuu : fullName}
                    </Text>
                    {isSeiyuu && casts[0].note && (
                      <Text textAlign="center" fontSize="xs">
                        ({casts[0].note})
                      </Text>
                    )}
                  </Stack>
                </Stack>
              </Table.Cell>
              <Table.Cell>
                {isSeiyuu ? (
                  fullName
                ) : (
                  <Stack gap="1" alignItems="center">
                    {casts.map((c) => {
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

              <Table.Cell>
                <Badge
                  style={{ backgroundColor: seriesColor ?? undefined }}
                  size="sm"
                  color="colorPalette.fg"
                >
                  {series}
                </Badge>
              </Table.Cell>
              <Table.Cell>{school}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};
