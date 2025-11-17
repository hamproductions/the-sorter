/**
 * Import Dialog Component
 * Allows users to import setlists from various formats
 */

import { useTranslation } from 'react-i18next';
import { useState, useRef, useMemo } from 'react';
import { Box, Stack, Grid } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Textarea } from '~/components/ui/styled/textarea';
import { Input } from '~/components/ui/styled/input';
import {
  importFromJSON,
  importFromFile,
  parseActualSetlist
} from '~/utils/setlist-prediction/import';
import type { SetlistPrediction, SetlistItem } from '~/types/setlist-prediction';
import { usePerformanceData } from '~/hooks/setlist-prediction/usePerformanceData';
import { SetlistView } from '~/components/setlist-prediction/SetlistView';
import { getSongColor } from '~/utils/song';
import {
  Root as DialogRoot,
  Backdrop as DialogBackdrop,
  Positioner as DialogPositioner,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  CloseTrigger as DialogCloseTrigger
} from '~/components/ui/styled/dialog';

export interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (prediction: SetlistPrediction) => void;
  performanceId: string;
}

export function ImportDialog({ open, onOpenChange, onImport, performanceId }: ImportDialogProps) {
  const { t } = useTranslation();
  const { performances } = usePerformanceData();
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'text' | 'json' | 'file' | 'performance'>(
    'performance'
  );
  const [performanceSearch, setPerformanceSearch] = useState('');
  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current performance to filter by same series
  const currentPerformance = useMemo(() => {
    return performances.find((p) => p.id === performanceId);
  }, [performances, performanceId]);

  // Filter performances for import
  const availablePerformances = useMemo(() => {
    let filtered = performances.filter(
      (p) => p.id !== performanceId && p.actualSetlist && p.actualSetlist.items.length > 0
    );

    // Apply search filter
    if (performanceSearch.trim()) {
      const searchLower = performanceSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.venue?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered.slice(0, 20); // Limit to 20 results
  }, [performances, performanceId, performanceSearch]);

  // Filter for same series/tour
  const sameTourPerformances = useMemo(() => {
    if (!currentPerformance) return [];
    return availablePerformances.filter((p) =>
      p.seriesIds.some((id) => currentPerformance.seriesIds.includes(id))
    );
  }, [availablePerformances, currentPerformance]);

  const handleTextImport = () => {
    setError(null);

    try {
      if (importType === 'json') {
        // Import as JSON
        const result = importFromJSON(textInput);
        if (result.success && result.prediction) {
          onImport({ ...result.prediction, performanceId });
          onOpenChange(false);
          setTextInput('');
        } else {
          setError(result.errors.join(', '));
        }
      } else {
        // Import as text setlist
        const parsed = parseActualSetlist(textInput);

        // Convert to prediction - create proper SetlistItem objects
        const prediction: SetlistPrediction = {
          id: `pred-${Date.now()}`,
          performanceId,
          name: 'Imported Prediction',
          setlist: {
            id: `setlist-${Date.now()}`,
            performanceId,
            items: parsed.items.map((item, idx) => {
              const id = `item-${Date.now()}-${idx}`;
              const position = idx;

              // Check if this is a divider (contains ━━, ---, or ===)
              const isDivider =
                item.title &&
                (item.title.includes('━━') ||
                  item.title.includes('---') ||
                  item.title.includes('==='));

              // For dividers: always create as other items
              if (isDivider) {
                return {
                  id,
                  position,
                  type: 'other' as const,
                  title: item.title || '',
                  remarks: item.remarks
                };
              }

              // For songs: create custom songs with the title
              if (item.type === 'song') {
                return {
                  id,
                  position,
                  type: 'song' as const,
                  songId: '', // Will be set when user matches to actual song
                  isCustomSong: true,
                  customSongName: item.title || 'Unknown Song',
                  remarks: item.remarks
                };
              }

              // For non-song items: map to 'mc' or 'other'
              const nonSongType = item.type === 'mc' ? 'mc' : 'other';
              return {
                id,
                position,
                type: nonSongType,
                title: item.title || '',
                remarks: item.remarks
              };
            }),
            sections: [],
            totalSongs: parsed.items.filter((i) => i.type === 'song').length
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        onImport(prediction);
        onOpenChange(false);
        setTextInput('');
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleFileImport = async () => {
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      const result = await importFromFile(file);
      if (result.success && result.prediction) {
        onImport({ ...result.prediction, performanceId });
        onOpenChange(false);
      } else {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePerformanceImport = () => {
    setError(null);

    if (!selectedPerformanceId) {
      setError('Please select a performance');
      return;
    }

    const selectedPerformance = performances.find((p) => p.id === selectedPerformanceId);
    if (!selectedPerformance || !selectedPerformance.actualSetlist) {
      setError('Selected performance has no setlist data');
      return;
    }

    // Find encore section from sections array
    const encoreSection = selectedPerformance.actualSetlist.sections?.find(
      (s) => s.type === 'encore' || s.name.toLowerCase().includes('encore')
    );
    const encoreStartIndex = encoreSection?.startIndex ?? -1;

    // Transform the actual setlist from the selected performance
    const transformedItems: SetlistItem[] = [];
    let encoreDividerInserted = false;

    selectedPerformance.actualSetlist.items.forEach((item, index) => {
      // Insert encore divider before first encore item
      if (encoreStartIndex >= 0 && index === encoreStartIndex && !encoreDividerInserted) {
        transformedItems.push({
          id: `item-${Date.now()}-divider`,
          type: 'other',
          title: '━━ ENCORE ━━',
          position: transformedItems.length
        });
        encoreDividerInserted = true;
      }

      // Map item types
      if (item.type === 'song') {
        // Songs: use songId to let the system look up the actual song name
        transformedItems.push({
          id: `item-${Date.now()}-${transformedItems.length}`,
          type: 'song' as const,
          songId: item.songId || '',
          customSongName: item.customSongName, // Preserve original name as fallback
          remarks: item.remarks,
          position: transformedItems.length
        });
      } else if (item.type === 'mc') {
        // MC items stay as MC
        transformedItems.push({
          id: `item-${Date.now()}-${transformedItems.length}`,
          type: 'mc',
          title: item.title || 'MC',
          remarks: item.remarks,
          position: transformedItems.length
        });
      } else {
        // Other types map to 'other'
        transformedItems.push({
          id: `item-${Date.now()}-${transformedItems.length}`,
          type: 'other',
          title: item.title || 'Other',
          remarks: item.remarks,
          position: transformedItems.length
        });
      }
    });

    const songCount = transformedItems.filter((item) => item.type === 'song').length;

    const prediction: SetlistPrediction = {
      id: `pred-${Date.now()}`,
      performanceId,
      name: `Imported from ${selectedPerformance.name}`,
      setlist: {
        id: `setlist-${Date.now()}`,
        performanceId,
        items: transformedItems,
        sections: [],
        totalSongs: songCount
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onImport(prediction);
    onOpenChange(false);
    setSelectedPerformanceId(null);
    setPerformanceSearch('');
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details: { open: boolean }) => onOpenChange(details.open)}
    >
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="1000px" maxH="90vh" overflow="hidden" display="flex" flexDirection="column">
          <Stack gap={4} p={6} flex={1} overflow="hidden" minH={0}>
            <DialogTitle>
              {t('setlistPrediction.importSetlist', { defaultValue: 'Import Setlist' })}
            </DialogTitle>

            <DialogDescription>
              <Text fontSize="sm">
                {t('setlistPrediction.importDescription', {
                  defaultValue: 'Import a setlist from text, JSON, or a file.'
                })}
              </Text>
            </DialogDescription>

            {/* Import Type Selector */}
            <Stack gap={2}>
              <Text fontSize="sm" fontWeight="medium">
                {t('setlistPrediction.importType', { defaultValue: 'Import Type' })}
              </Text>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  size="sm"
                  variant={importType === 'performance' ? 'solid' : 'outline'}
                  onClick={() => setImportType('performance')}
                >
                  {t('setlistPrediction.fromPerformance', { defaultValue: 'From Performance' })}
                </Button>
                <Button
                  size="sm"
                  variant={importType === 'text' ? 'solid' : 'outline'}
                  onClick={() => setImportType('text')}
                >
                  {t('setlistPrediction.textList', { defaultValue: 'Text List' })}
                </Button>
                <Button
                  size="sm"
                  variant={importType === 'json' ? 'solid' : 'outline'}
                  onClick={() => setImportType('json')}
                >
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant={importType === 'file' ? 'solid' : 'outline'}
                  onClick={() => setImportType('file')}
                >
                  {t('setlistPrediction.file', { defaultValue: 'File' })}
                </Button>
              </Box>
            </Stack>

            {/* Input Area */}
            {importType === 'performance' ? (
              <Grid gap={4} columns={2} flex={1} overflow="hidden">
                {/* Left column: Performance selection */}
                <Stack gap={3} display="flex" flexDirection="column" overflow="hidden">
                  {/* Search Input */}
                  <Box>
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      {t('setlistPrediction.searchPerformances', {
                        defaultValue: 'Search Performances'
                      })}
                    </Text>
                    <Input
                      value={performanceSearch}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPerformanceSearch(e.target.value)
                      }
                      placeholder={t('setlistPrediction.searchPlaceholder', {
                        defaultValue: 'Search by name, venue...'
                      })}
                    />
                  </Box>

                  {/* Performance List */}
                  {sameTourPerformances.length > 0 && (
                    <Box flex={1} display="flex" flexDirection="column" minH={0}>
                      <Box
                        flex={1}
                        borderRadius="md"
                        borderWidth="1px"
                        bgColor="bg.default"
                        overflow="auto"
                        minH={0}
                      >
                        {sameTourPerformances.map((perf) => (
                          <Box
                            key={perf.id}
                            onClick={() => setSelectedPerformanceId(perf.id)}
                            borderBottomWidth="1px"
                            p={2}
                            bgColor={
                              selectedPerformanceId === perf.id ? 'bg.emphasized' : undefined
                            }
                            cursor="pointer"
                            _hover={{ bgColor: 'bg.subtle' }}
                          >
                            <Stack gap={0.5}>
                              <Text fontSize="sm" fontWeight="medium">
                                {perf.name}
                              </Text>
                              <Text color="fg.muted" fontSize="xs">
                                {new Date(perf.date).toLocaleDateString()} • {perf.venue} •{' '}
                                {perf.actualSetlist?.totalSongs} songs
                              </Text>
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                </Stack>

                {/* Right column: Setlist preview */}
                <Box display="flex" flexDirection="column" overflow="hidden">
                  <Text mb={2} fontSize="sm" fontWeight="bold">
                    {t('setlistPrediction.preview', { defaultValue: 'Preview' })}
                  </Text>
                  {selectedPerformanceId ? (
                    (() => {
                      const selectedPerf = performances.find((p) => p.id === selectedPerformanceId);
                      if (!selectedPerf || !selectedPerf.actualSetlist) return null;

                      return (
                        <Box
                          flex={1}
                          borderRadius="md"
                          borderWidth="1px"
                          p={3}
                          bgColor="bg.subtle"
                          overflow="auto"
                          minH={0}
                          maxH="100%"
                        >
                          <SetlistView
                            setlist={selectedPerf.actualSetlist}
                            performance={selectedPerf}
                            showHeader={false}
                            compact={true}
                          />
                        </Box>
                      );
                    })()
                  ) : (
                    <Box
                      flex={1}
                      borderRadius="md"
                      borderWidth="1px"
                      p={4}
                      bgColor="bg.subtle"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      minH={0}
                      maxH="100%"
                    >
                      <Text color="fg.muted" fontSize="sm">
                        {t('setlistPrediction.selectPerformanceToPreview', {
                          defaultValue: 'Select a performance to preview its setlist'
                        })}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Grid>
            ) : importType === 'file' ? (
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt,.csv"
                  style={{ width: '100%' }}
                />
              </Box>
            ) : (
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  importType === 'json'
                    ? t('setlistPrediction.pasteJSON', {
                        defaultValue: 'Paste JSON data here...'
                      })
                    : t('setlistPrediction.pasteSetlist', {
                        defaultValue:
                          'Paste setlist here (one song per line)...\nExample:\n1. Song Name\nMC①\n2. Another Song'
                      })
                }
                rows={10}
              />
            )}

            {/* Error Display */}
            {error && (
              <Box borderRadius="md" p={2} bgColor="bg.error">
                <Text color="fg.error" fontSize="sm">
                  {error}
                </Text>
              </Box>
            )}

            {/* Actions */}
            <Box display="flex" gap={2} justifyContent="flex-end" borderTopWidth="1px" pt={4} mt={4}>
              <DialogCloseTrigger asChild>
                <Button variant="outline">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
              </DialogCloseTrigger>
              <Button
                onClick={() => {
                  if (importType === 'performance') {
                    handlePerformanceImport();
                  } else if (importType === 'file') {
                    handleFileImport();
                  } else {
                    handleTextImport();
                  }
                }}
                disabled={
                  importType === 'performance'
                    ? !selectedPerformanceId
                    : importType === 'file'
                      ? false
                      : !textInput.trim()
                }
              >
                {t('common.import', { defaultValue: 'Import' })}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
