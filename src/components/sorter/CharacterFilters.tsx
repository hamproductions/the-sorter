import { Stack, Wrap } from 'styled-system/jsx';
import { useData } from '~/hooks/useData';
import uniqBy from 'lodash/uniqBy';
import { Text } from '../ui/text';
import { Checkbox } from '../ui/checkbox';

export const CharacterFilters = () => {
  const data = useData();
  const series = Array.from(new Set(data.map((d) => d.series)));
  const school = Array.from(new Set(data.map((d) => d.school)));
  const names = Array.from(new Set(data.map((d) => d.fullName)));
  const units = uniqBy(
    data.flatMap((d) => d.units),
    (u) => u.id
  ).filter((u) => names.every((n) => !u.name.includes(n)));

  return (
    <Stack>
      <Stack>
        <Text fontWeight="bold">シリーズ</Text>
        <Wrap>
          {series.map((s) => {
            return (
              <Checkbox size="sm" key={s}>
                {s}
              </Checkbox>
            );
          })}
        </Wrap>
      </Stack>
      <Stack>
        <Text fontWeight="bold">学校</Text>
        <Wrap>
          {school.map((s) => {
            return (
              <Checkbox size="sm" key={s}>
                {s}
              </Checkbox>
            );
          })}
        </Wrap>
      </Stack>
      <Stack>
        <Text fontWeight="bold">ユニット</Text>
        <Wrap>
          {units.map((s) => {
            return (
              <Checkbox size="sm" key={s.id}>
                {s.name}
              </Checkbox>
            );
          })}
        </Wrap>
      </Stack>
    </Stack>
  );
};
