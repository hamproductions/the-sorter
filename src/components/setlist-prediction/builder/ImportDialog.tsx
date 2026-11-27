/**
 * Import Dialog Component
 * Allows users to import setlists from various formats
 */

import { useTranslation } from 'react-i18next';
import { useState, useRef, useMemo } from 'react';
import { css } from 'styled-system/css';
import { Box, Stack, Grid } from 'styled-system/jsx';
import { Button } from '~/components/ui/styled/button';
import { Text } from '~/components/ui/styled/text';
import { Textarea } from '~/components/ui/styled/textarea';
import { Input } from '~/components/ui/styled/input';
import { importFromJSON, importFromFile } from '~/utils/setlist-prediction/import';
import {
  createPredictionFromSetlist,
  createPredictionFromText
} from '~/utils/setlist-prediction/import-prediction';
import type { SetlistPrediction } from '~/types/setlist-prediction';
import {
  usePerformanceData,
  usePerformanceSetlist
} from '~/hooks/setlist-prediction/usePerformanceData';
import { SetlistView } from '~/components/setlist-prediction/SetlistView';
import { getFullPerformanceName } from '~/utils/names';
import { matchesEventAlias } from '~/utils/abbreviations';
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
  performanceId?: string;
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

  // Lazy load selected performance setlist
  const {
    setlist: selectedSetlist,
    loading: loadingSetlist,
    error: setlistError
  } = usePerformanceSetlist(selectedPerformanceId || undefined);

  // Get current performance to filter by same series
  const currentPerformance = useMemo(() => {
    return performances.find((p) => p.id === performanceId);
  }, [performances, performanceId]);

  // Filter performances for import
  const availablePerformances = useMemo(() => {
    let filtered = performances.filter((p) => p.id !== performanceId && p.hasSetlist);

    // Apply search filter
    if (performanceSearch.trim()) {
      const searchLower = performanceSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.tourName.toLowerCase().includes(searchLower) ||
          p.venue?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          matchesEventAlias(p.eventId, performanceSearch)
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
        onImport(createPredictionFromText(textInput, performanceId));
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

    if (!selectedSetlist) {
      setError('Selected performance has no setlist data or is still loading');
      return;
    }

    const selectedPerformance = performances.find((p) => p.id === selectedPerformanceId);

    onImport(createPredictionFromSetlist(selectedSetlist, selectedPerformance, performanceId));
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
        <DialogContent
          display="flex"
          flexDirection="column"
          maxW="1000px"
          maxH="90vh"
          overflow="hidden"
        >
          <Stack flex={1} gap={4} minH={0} p={6} overflow="hidden">
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
              <Grid flex={1} gap={4} overflow="hidden" columns={2}>
                {/* Left column: Performance selection */}
                <Stack display="flex" gap={3} flexDirection="column" overflow="hidden">
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
                    <Box display="flex" flex={1} flexDirection="column" minH={0}>
                      <Box
                        flex={1}
                        borderRadius="md"
                        borderWidth="1px"
                        minH={0}
                        bgColor="bg.default"
                        overflow="auto"
                      >
                        {sameTourPerformances.map((perf) => (
                          <Box
                            className={css({
                              '&[data-selected=true]': { bgColor: 'bg.emphasized' }
                            })}
                            key={perf.id}
                            data-selected={selectedPerformanceId === perf.id}
                            onClick={() => setSelectedPerformanceId(perf.id)}
                            cursor="pointer"
                            borderBottomWidth="1px"
                            p={2}
                            _hover={{ bgColor: 'bg.subtle' }}
                          >
                            <Stack gap={0.5}>
                              <Text fontSize="sm" fontWeight="medium">
                                {getFullPerformanceName(perf)}
                              </Text>
                              <Text color="fg.muted" fontSize="xs">
                                {new Date(perf.date).toLocaleDateString()} • {perf.venue} •{' '}
                                {perf.actualSetlist?.items.filter((i) => i.type === 'song').length}{' '}
                                songs
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
                      if (!selectedPerf) return null;

                      if (loadingSetlist) {
                        return (
                          <Box display="flex" flex={1} justifyContent="center" alignItems="center">
                            <Text>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
                          </Box>
                        );
                      }

                      if (setlistError || !selectedSetlist) {
                        return (
                          <Box display="flex" flex={1} justifyContent="center" alignItems="center">
                            <Text color="fg.error">
                              {setlistError?.message || 'Setlist not found'}
                            </Text>
                          </Box>
                        );
                      }

                      return (
                        <Box
                          flex={1}
                          borderRadius="md"
                          borderWidth="1px"
                          minH={0}
                          maxH="100%"
                          p={3}
                          bgColor="bg.subtle"
                          overflow="auto"
                        >
                          <SetlistView
                            prediction={{
                              id: 'temp',
                              performanceId: selectedPerf.id,
                              name: getFullPerformanceName(selectedPerf),
                              setlist: selectedSetlist,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            }}
                            performance={selectedPerf}
                            showHeader={false}
                            compact={true}
                          />
                        </Box>
                      );
                    })()
                  ) : (
                    <Box
                      display="flex"
                      flex={1}
                      justifyContent="center"
                      alignItems="center"
                      borderRadius="md"
                      borderWidth="1px"
                      minH={0}
                      maxH="100%"
                      p={4}
                      bgColor="bg.subtle"
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
            <Box
              display="flex"
              gap={2}
              justifyContent="flex-end"
              borderTopWidth="1px"
              mt={4}
              pt={4}
            >
              <DialogCloseTrigger asChild>
                <Button variant="outline">{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
              </DialogCloseTrigger>
              <Button
                onClick={() => {
                  if (importType === 'performance') {
                    handlePerformanceImport();
                  } else if (importType === 'file') {
                    void handleFileImport();
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
