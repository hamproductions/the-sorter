import { useTranslation } from 'react-i18next';
import { FaEarthAsia } from 'react-icons/fa6';
import { ItemThumbnail } from '../leaderboard/ItemThumbnail';
import { useRankingItems } from '../leaderboard/useRankingItems';
import { Badge } from '../ui/badge';
import type { SavedSortState } from '~/types/save-state';
import { HStack } from 'styled-system/jsx';

const PREVIEW_COUNT = 3;

export function SavePreview({ save }: { save: SavedSortState }) {
  const { t } = useTranslation();
  const isCharacters = save.sorterType === 'characters';
  const isSeiyuu = save.isSeiyuu ?? save.log?.context?.mode === 'seiyuu';
  const resolve = useRankingItems(
    isCharacters ? 'character' : 'song',
    isCharacters ? (isSeiyuu ? 'seiyuu' : 'chara') : undefined
  );
  const top = save.state.arr.flat().slice(0, PREVIEW_COUNT).map(String);
  const submission = save.log?.submission;

  return (
    <HStack data-testid="save-preview" gap="2" justifyContent="space-between" flexWrap="wrap">
      <HStack gap="1">
        {top.map((id) => {
          const item = resolve(id);
          return (
            <HStack key={id} title={item.name}>
              <ItemThumbnail item={item} size="8" />
            </HStack>
          );
        })}
      </HStack>
      {save.log?.context && (
        <Badge size="sm" variant={submission ? 'subtle' : 'outline'}>
          <FaEarthAsia />
          {submission
            ? t(
                submission.status === 'pending_review'
                  ? 'global_ranking.saved_pending_review'
                  : 'global_ranking.saved_added'
              )
            : t('global_ranking.saved_not_added')}
        </Badge>
      )}
    </HStack>
  );
}
