import { Character } from '~/types';
import * as Table from '../ui/table';

export const RankingTable = ({ characters }: { characters: Character[] }) => {
  return (
    <Table.Root size="sm">
      <Table.Head>
        <Table.Row>
          <Table.Header>No.</Table.Header>
          <Table.Header>キャラクター</Table.Header>
          <Table.Header>声優</Table.Header>
          <Table.Header>シリーズ・学校</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {characters.map((c, idx) => {
          const { fullName, seiyuu, school, series } = c;
          return (
            <Table.Row key={idx}>
              <Table.Cell>{idx + 1}</Table.Cell>
              <Table.Cell>{fullName}</Table.Cell>
              <Table.Cell>{seiyuu}</Table.Cell>
              <Table.Cell>
                {series}・{school}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};
