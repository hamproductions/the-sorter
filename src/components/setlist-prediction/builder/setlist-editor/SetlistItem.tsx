/**
 * Individual Setlist Item Component
 * Draggable and editable setlist item - LLdays style
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BiTrash, BiPencil, BiChevronUp, BiChevronDown, BiLinkExternal } from 'react-icons/bi';
import { MdDragIndicator } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, memo } from 'react';
import artistsData from '../../../../../data/artists-info.json';
import { EditItemDialog } from '../EditItemDialog';
import { DropPreview } from './DropPreview';
import { css } from 'styled-system/css';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Text } from '~/components/ui/styled/text';
import { Link } from '~/components/ui/link';
import { IconButton } from '~/components/ui/styled/icon-button';
import type { SetlistItem as SetlistItemType } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';
import type { Song } from '~/types';

export interface SetlistItemProps {
  item: SetlistItemType;
  index: number;
  songNumber?: number; // Separate song numbering (M01, M02, etc.)
  encoreNumber?: number; // Separate encore numbering (EN01, EN02, etc.)
  mcNumber?: number; // Separate MC numbering (MC①, MC②, etc.)
  onRemove: () => void;
  onUpdate: (updates: Partial<SetlistItemType>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  showSectionDivider?: boolean;
  sectionName?: string;
  dropIndicatorPosition?: 'top' | 'bottom' | 'end' | null;
  draggedItem?: SetlistItemType;
  draggedSongDetails?: Song;
}

// Convert number to circled number (①②③...)
const toCircledNumber = (num: number): string => {
  const circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  return circled[num - 1] || `(${num})`;
};

const SetlistItemComponent = memo(function SetlistItem({
  item,
  index,
  songNumber,
  encoreNumber,
  mcNumber,
  onRemove,
  onUpdate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  showSectionDivider,
  sectionName,
  dropIndicatorPosition,
  draggedItem,
  draggedSongDetails
}: SetlistItemProps) {
  const { t } = useTranslation();
  const songData = useSongData();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Look up song details if this is a song item (must be before useSortable)
  const songDetails = useMemo(() => {
    if (!isSongItem(item) || item.isCustomSong) return null;

    const songs = Array.isArray(songData) ? songData : [];
    return songs.find((song: Song) => String(song.id) === String(item.songId)) || null;
  }, [item, songData]);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.id,
    data: {
      type: 'setlist-item',
      item: item,
      songDetails: songDetails
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Get song color for border
  const songColor = useMemo(() => {
    if (!isSongItem(item) || !songDetails) return undefined;
    return getSongColor(songDetails);
  }, [item, songDetails]);

  // Get artist/unit name
  const artistName = useMemo(() => {
    if (!isSongItem(item) || !songDetails || !songDetails.artists) return undefined;

    // Get the first artist ID from the song's artists array
    const firstArtistId = songDetails.artists[0];
    if (!firstArtistId) return undefined;

    // Look up the artist name
    const artist = artistsData.find((a) => a.id === String(firstArtistId));
    return artist?.name;
  }, [item, songDetails]);

  // Determine item number display
  const itemNumber = useMemo(() => {
    // For songs, check if they have encore number (position-based)
    if (isSongItem(item)) {
      if (encoreNumber) {
        return `EN${encoreNumber.toString().padStart(2, '0')}`;
      } else if (songNumber) {
        return `M${songNumber.toString().padStart(2, '0')}`;
      }
      return `${index + 1}`;
    }

    // For MCs
    if (item.type === 'mc') {
      return mcNumber ? `MC${toCircledNumber(mcNumber)}` : `MC${toCircledNumber(index + 1)}`;
    }

    // Other items (dividers, etc.) have no number
    return null;
  }, [item, songNumber, encoreNumber, mcNumber, index]);

  // Check if this is a divider-style item (e.g., "━━ ENCORE ━━")
  const isDivider =
    !isSongItem(item) &&
    (item.title.includes('━━') || item.title.includes('---') || item.title.includes('==='));

  return (
    <>
      {/* Section Divider */}
      {showSectionDivider && sectionName && (
        <Box
          borderColor="border.emphasized"
          borderRadius="md"
          borderWidth="1px"
          mb={1}
          p={2}
          bgColor="bg.emphasized"
        >
          <HStack gap={2} alignItems="center">
            <Box flex={1} h="2px" bgColor="border.emphasized" />
            <Text color="fg.emphasized" fontSize="sm" fontWeight="bold">
              {sectionName}
            </Text>
            <Box flex={1} h="2px" bgColor="border.emphasized" />
          </HStack>
        </Box>
      )}

      {/* Drop Preview - Top */}
      {dropIndicatorPosition === 'top' && draggedItem && (
        <DropPreview draggedItem={draggedItem} songDetails={draggedSongDetails} position="top" />
      )}

      <Box
        className={css({ '&[data-is-dragging=true]': { opacity: 0.5 } })}
        ref={setNodeRef}
        data-item-id={item.id}
        data-is-dragging={isDragging}
        style={{ ...style, '--song-color': songColor } as React.CSSProperties}
        position="relative"
      >
        <Box
          className={css({
            '&[data-is-divider=true]': { py: 3, bgColor: 'bg.emphasized' },
            '&[data-has-color=true]': { borderLeft: '4px solid', borderColor: 'var(--song-color)' }
          })}
          data-is-divider={isDivider}
          data-has-color={Boolean(isSongItem(item) && songColor)}
          borderRadius="md"
          py={2}
          px={3}
          bgColor="bg.default"
          _hover={{ bgColor: 'bg.muted' }}
        >
          <HStack gap={2} justifyContent="space-between" alignItems="flex-start">
            {/* Drag Handle */}
            <HStack flex={1} gap={2} overflow="hidden">
              <Box
                ref={setActivatorNodeRef}
                data-is-dragging={isDragging}
                p={2}
                {...attributes}
                {...listeners}
                className={css({ '&[data-is-dragging=true]': { cursor: 'grabbing' } })}
                style={{ touchAction: 'none' }}
                cursor="grab"
                color="fg.muted"
                _hover={{ color: 'fg.default' }}
              >
                <MdDragIndicator size={20} />
              </Box>

              {/* Item Number */}
              {itemNumber && (
                <Text
                  flexShrink={0}
                  minW="24px"
                  color={isSongItem(item) ? 'fg.default' : 'fg.muted'}
                  textAlign="center"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {itemNumber}
                </Text>
              )}

              {/* Item Content */}
              <Stack flex={1} gap={0.5}>
                {isSongItem(item) ? (
                  <>
                    <HStack gap={2} alignItems="center">
                      <Text fontSize="sm" fontWeight="medium" lineHeight="1.4">
                        {item.isCustomSong
                          ? item.customSongName
                          : songDetails?.name || item.customSongName || `Song ${item.songId}`}
                      </Text>
                      {!item.isCustomSong && (
                        <Link
                          href={`https://ll-fans.jp/data/song/${item.songId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          display="inline-flex"
                          alignItems="center"
                          borderRadius="sm"
                          py={0.5}
                          px={1.5}
                          color="fg.muted"
                          bgColor="bg.subtle"
                          _hover={{ color: 'fg.default', bgColor: 'bg.emphasized' }}
                        >
                          <BiLinkExternal size={10} />
                        </Link>
                      )}
                    </HStack>
                    {/* Show remarks if exists, otherwise show artist name */}
                    {/* This logic mirrors that in the "SetlistView" component; ideally we'd have a way to unify this display logic since it should be more or less the exact same */}
                    {!item.isCustomSong && artistName && !item.remarks && (
                      <Text color="fg.muted" fontSize="xs" lineHeight="1.3">
                        {artistName}
                      </Text>
                    )}
                    {/* Remarks (shown instead of artist if present) */}
                    {item.remarks && (
                      <Text color="fg.muted" fontSize="xs" lineHeight="1.3" fontStyle="italic">
                        {item.remarks}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text
                      w={isDivider ? 'full' : 'auto'}
                      textAlign={isDivider ? 'center' : 'left'}
                      fontSize="sm"
                      fontWeight={isDivider ? 'bold' : 'medium'}
                      lineHeight="1.4"
                    >
                      {item.title}
                    </Text>
                    {item.remarks && (
                      <Text color="fg.muted" fontSize="xs" lineHeight="1.3">
                        {item.remarks}
                      </Text>
                    )}
                  </>
                )}
              </Stack>
            </HStack>

            {/* Actions */}
            <HStack gap={1} flexShrink={0}>
              <Stack gap={0}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  disabled={isFirst}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp();
                  }}
                  aria-label={t('common.moveUp', { defaultValue: 'Move up' })}
                  minW="32px"
                  h="24px"
                  _active={{ bg: 'bg.subtle' }}
                >
                  <BiChevronUp size={20} />
                </IconButton>
                <IconButton
                  size="xs"
                  variant="ghost"
                  disabled={isLast}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown();
                  }}
                  aria-label={t('common.moveDown', { defaultValue: 'Move down' })}
                  minW="32px"
                  h="24px"
                  _active={{ bg: 'bg.subtle' }}
                >
                  <BiChevronDown size={20} />
                </IconButton>
              </Stack>
              <IconButton
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}
                aria-label={t('setlistPrediction.editItem', {
                  defaultValue: 'Edit item'
                })}
              >
                <BiPencil size={14} />
              </IconButton>
              <IconButton
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                aria-label={t('common.delete', { defaultValue: 'Delete' })}
              >
                <BiTrash size={14} />
              </IconButton>
            </HStack>
          </HStack>
        </Box>
      </Box>

      {/* Drop Preview - Bottom */}
      {dropIndicatorPosition === 'bottom' && draggedItem && (
        <DropPreview draggedItem={draggedItem} songDetails={draggedSongDetails} position="bottom" />
      )}

      {/* Edit Dialog */}
      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={item}
        onSave={onUpdate}
      />
    </>
  );
});

export { SetlistItemComponent as SetlistItem };
