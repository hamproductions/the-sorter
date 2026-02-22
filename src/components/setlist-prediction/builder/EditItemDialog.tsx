/**
 * Edit Item Dialog - Modal for editing setlist items
 * Allows changing the song, editing custom song name, and editing remarks
 */

import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import artistsData from '../../../../data/artists-info.json';
import { getArtistName, getSongName } from '~/utils/names';
import {
  Root as DialogRoot,
  Backdrop as DialogBackdrop,
  Positioner as DialogPositioner,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  CloseTrigger as DialogCloseTrigger
} from '~/components/ui/styled/dialog';
import { Box, Stack, HStack } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Input } from '~/components/ui/styled/input';
import { Text } from '~/components/ui/styled/text';
import type { SetlistItem, SongSetlistItem, NonSongSetlistItem } from '~/types/setlist-prediction';
import { isSongItem } from '~/types/setlist-prediction';
import { useSongData } from '~/hooks/useSongData';
import { getSongColor } from '~/utils/song';
import { fuzzySearch, getSearchScore } from '~/utils/search';
import type { Song } from '~/types';

export interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SetlistItem;
  onSave: (updates: Partial<SetlistItem>) => void;
}

export function EditItemDialog({ open, onOpenChange, item, onSave }: EditItemDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const songData = useSongData();

  const [searchQuery, setSearchQuery] = useState('');
  const [remarks, setRemarks] = useState(item.remarks || '');
  const [customSongName, setCustomSongName] = useState(
    isSongItem(item) && item.isCustomSong ? item.customSongName || '' : ''
  );
  const [selectedSongId, setSelectedSongId] = useState(
    isSongItem(item) && !item.isCustomSong ? item.songId : null
  );

  // For non-song items (MC/Other)
  const [title, setTitle] = useState(!isSongItem(item) ? item.title : '');

  // Filter songs based on search query
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const songs = Array.isArray(songData) ? songData : [];
    return songs
      .filter((song) => fuzzySearch(song, searchQuery))
      .toSorted((a, b) => getSearchScore(b, searchQuery) - getSearchScore(a, searchQuery))
      .slice(0, 20)
      .map((song) => {
        const artistRef = song.artists?.[0];
        const artist = artistRef ? artistsData.find((a) => a.id === artistRef.id) : null;

        return {
          id: song.id,
          name: song.name,
          englishName: song.englishName,
          artist: artist ? getArtistName(artist.name, lang) : undefined,
          color: getSongColor(song)
        };
      });
  }, [songData, searchQuery, lang]);

  const handleSave = () => {
    const updates: Partial<SetlistItem> = {
      remarks: remarks || undefined
    };

    if (isSongItem(item)) {
      if (item.isCustomSong) {
        // Update custom song name
        (updates as Partial<SongSetlistItem>).customSongName = customSongName;
      } else if (selectedSongId && selectedSongId !== item.songId) {
        // Change to different song
        (updates as Partial<SongSetlistItem>).songId = selectedSongId;
        (updates as Partial<SongSetlistItem>).isCustomSong = false;
      }
    } else {
      // Update non-song items (MC/Other)
      const nonSongUpdates = updates as Partial<NonSongSetlistItem>;

      if (title && title !== item.title) {
        nonSongUpdates.title = title;
      }
    }

    onSave(updates);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSearchQuery('');
    setRemarks(item.remarks || '');
    setCustomSongName(isSongItem(item) && item.isCustomSong ? item.customSongName || '' : '');
    setSelectedSongId(isSongItem(item) && !item.isCustomSong ? item.songId : null);
    setTitle(!isSongItem(item) ? item.title : '');
    onOpenChange(false);
  };

  // Get current song name
  const currentSongName = useMemo(() => {
    if (!isSongItem(item)) return null;
    if (item.isCustomSong) return item.customSongName || 'Custom Song';

    const songs = Array.isArray(songData) ? songData : [];
    const song = songs.find((s: Song) => s.id === item.songId);
    return song ? getSongName(song.name, song.englishName, lang) : `Song ${item.songId}`;
  }, [item, songData, lang]);

  // Get staged replacement song info
  const stagedSong = useMemo(() => {
    if (!selectedSongId || !isSongItem(item) || selectedSongId === item.songId) return null;

    const songs = Array.isArray(songData) ? songData : [];
    const song = songs.find((s: Song) => s.id === selectedSongId);
    if (!song) return null;

    const artistRef = song.artists?.[0];
    const artist = artistRef ? artistsData.find((a) => a.id === artistRef.id) : null;

    return {
      id: song.id,
      displayName: getSongName(song.name, song.englishName, lang),
      japaneseName: lang === 'en' && song.englishName ? song.name : undefined,
      artist: artist ? getArtistName(artist.name, lang) : undefined,
      color: getSongColor(song)
    };
  }, [selectedSongId, item, songData, lang]);

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details: { open: boolean }) => onOpenChange(details.open)}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="600px">
          <Stack gap={4} p={6}>
            <DialogTitle>
              {t('setlistPrediction.editItem', { defaultValue: 'Edit Item' })}
            </DialogTitle>

            <DialogDescription>
              <Text color="fg.muted" fontSize="sm">
                {isSongItem(item)
                  ? t('setlistPrediction.editItemDescription', {
                      defaultValue: 'Edit song details or add remarks/variant information.'
                    })
                  : t('setlistPrediction.editNonSongDescription', {
                      defaultValue: 'Edit item details and add remarks.'
                    })}
              </Text>
            </DialogDescription>

            <Stack gap={4}>
              {/* Current Song Display */}
              {isSongItem(item) && (
                <Box
                  borderRadius="md"
                  borderWidth="1px"
                  p={3}
                  bgColor="bg.muted"
                  opacity={stagedSong ? 0.5 : 1}
                >
                  <Text mb={1} fontSize="sm" fontWeight="medium">
                    {t('setlistPrediction.currentSong', { defaultValue: 'Current Song' })}
                  </Text>
                  <Text
                    fontSize="sm"
                    textDecoration={stagedSong ? 'line-through' : undefined}
                  >
                    {currentSongName}
                  </Text>
                </Box>
              )}

              {/* Non-Song Item Editors (MC/Other) */}
              {!isSongItem(item) && (
                <Box>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    {t('setlistPrediction.itemTitle', { defaultValue: 'Title' })}
                  </Text>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('setlistPrediction.enterTitle', {
                      defaultValue: 'Enter item title...'
                    })}
                  />
                </Box>
              )}

              {/* Custom Song Name Editor (only for custom songs) */}
              {isSongItem(item) && item.isCustomSong && (
                <Box>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    {t('setlistPrediction.customSongName', { defaultValue: 'Custom Song Name' })}
                  </Text>
                  <Input
                    value={customSongName}
                    onChange={(e) => setCustomSongName(e.target.value)}
                    placeholder={t('setlistPrediction.enterSongName', {
                      defaultValue: 'Enter song name...'
                    })}
                  />
                </Box>
              )}

              {/* Song Search / Staged Replacement (only for regular songs) */}
              {isSongItem(item) && !item.isCustomSong && (
                <Box>
                  <Text mb={2} fontSize="sm" fontWeight="medium">
                    {t('setlistPrediction.changeSong', { defaultValue: 'Change Song' })}
                  </Text>

                  {stagedSong ? (
                    /* Staged replacement preview — replaces the search input */
                    <Box
                      borderRadius="md"
                      borderWidth="2px"
                      borderColor="border.accent"
                      p={3}
                      bgColor="bg.subtle"
                    >
                      <HStack justifyContent="space-between" alignItems="flex-start">
                        <Stack gap={0.5} flex={1}>
                          <Text fontSize="sm" fontWeight="bold">
                            {stagedSong.displayName}
                          </Text>
                          {stagedSong.japaneseName && (
                            <Text color="fg.muted" fontSize="xs">
                              {stagedSong.japaneseName}
                            </Text>
                          )}
                          {stagedSong.artist && (
                            <Text
                              style={{ '--song-color': stagedSong.color } as React.CSSProperties}
                              color="var(--song-color)"
                              fontSize="xs"
                            >
                              {stagedSong.artist}
                            </Text>
                          )}
                        </Stack>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSongId(item.songId);
                            setSearchQuery('');
                          }}
                        >
                          {t('common.clear', { defaultValue: 'Clear' })}
                        </Button>
                      </HStack>
                    </Box>
                  ) : (
                    /* Search input + results */
                    <>
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('setlistPrediction.searchSongs', {
                          defaultValue: 'Search songs or artists...'
                        })}
                        mb={2}
                      />

                      {searchQuery && (
                        <Box
                          borderRadius="md"
                          borderWidth="1px"
                          maxH="200px"
                          bgColor="bg.default"
                          overflow="auto"
                        >
                          {filteredSongs.length === 0 ? (
                            <Box p={3}>
                              <Text color="fg.muted" fontSize="sm" textAlign="center">
                                {t('setlistPrediction.noSongsFound', {
                                  defaultValue: 'No songs found'
                                })}
                              </Text>
                            </Box>
                          ) : (
                            <Stack gap={0}>
                              {filteredSongs.map((song) => (
                                <Box
                                  key={song.id}
                                  onClick={() => setSelectedSongId(song.id)}
                                  cursor="pointer"
                                  borderBottomWidth="1px"
                                  p={2}
                                  bgColor="bg.default"
                                  _hover={{ bgColor: 'bg.subtle' }}
                                >
                                  <Stack gap={0.5}>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {getSongName(song.name, song.englishName, lang)}
                                    </Text>
                                    {lang === 'en' && song.englishName && (
                                      <Text color="fg.muted" fontSize="xs">
                                        {song.name}
                                      </Text>
                                    )}
                                    {song.artist && (
                                      <Text
                                        style={
                                          { '--song-color': song.color } as React.CSSProperties
                                        }
                                        color="var(--song-color)"
                                        fontSize="xs"
                                      >
                                        {song.artist}
                                      </Text>
                                    )}
                                  </Stack>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* Remarks/Variant Editor */}
              <Box>
                <Text mb={2} fontSize="sm" fontWeight="medium">
                  {t('setlistPrediction.variantRemarks', { defaultValue: 'Variant / Remarks' })}
                </Text>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={t('setlistPrediction.addRemarks', {
                    defaultValue: 'Ver., Acoustic, Special notes...'
                  })}
                />
                <Text mt={1} color="fg.muted" fontSize="xs">
                  {t('setlistPrediction.remarksHint', {
                    defaultValue: 'Variant info will replace the artist name in the setlist display'
                  })}
                </Text>
              </Box>
            </Stack>

            {/* Actions */}
            <HStack gap={2} justifyContent="flex-end" pt={2}>
              <DialogCloseTrigger asChild>
                <Button variant="outline" onClick={handleCancel}>
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </Button>
              </DialogCloseTrigger>
              <Button onClick={handleSave}>{t('common.save', { defaultValue: 'Save' })}</Button>
            </HStack>
          </Stack>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
