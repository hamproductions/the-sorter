import { useCallback, useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '../ui/button';
import { Text } from '../ui/text';

interface HeardleAudioPlayerProps {
  blobUrl: string | null;
  maxDuration: number; // in seconds
  startTime?: number; // offset in seconds to skip leading silence (default 0)
}

// Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function HeardleAudioPlayer({
  blobUrl,
  maxDuration,
  startTime = 0
}: HeardleAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);

  // Effective duration is the available audio from startTime, capped by maxDuration
  const effectiveDuration = Math.min(duration - startTime, maxDuration);

  // Reset playback when blob URL, max duration, or startTime changes
  useEffect(() => {
    setCurrentTime(startTime);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = startTime;
    }
  }, [blobUrl, maxDuration, startTime]);

  // Handle audio metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Small tolerance for floating point comparisons (startTime from sample detection has many decimals)
  const EPSILON = 0.01;

  // Handle time update - enforce max duration relative to startTime
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = Math.max(audioRef.current.currentTime, startTime);
      setCurrentTime(time);

      // Stop playback when startTime + maxDuration is reached
      if (time >= startTime + maxDuration - EPSILON) {
        audioRef.current.pause();
        audioRef.current.currentTime = startTime + maxDuration;
        setCurrentTime(startTime + maxDuration);
        setIsPlaying(false);
      }
    }
  }, [maxDuration, startTime]);

  // Handle play/pause toggle
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If at or past max duration (with epsilon tolerance since startTime from
      // sample detection produces high-precision floats that the browser's
      // currentTime rounds down), or audio naturally ended, restart from startTime
      if (
        audioRef.current.currentTime >= startTime + maxDuration - EPSILON ||
        audioRef.current.ended
      ) {
        audioRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, maxDuration, startTime]);

  // Handle audio ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle seeking - clamp to [startTime, startTime + maxDuration]
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const seekTime = Math.max(
        startTime,
        Math.min(startTime + percentage * effectiveDuration, startTime + maxDuration)
      );

      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    },
    [effectiveDuration, maxDuration, startTime]
  );

  if (!blobUrl) {
    return (
      <Stack alignItems="center" p={4}>
        <Text color="fg.muted">Loading audio...</Text>
      </Stack>
    );
  }

  const progressPercentage =
    effectiveDuration > 0 ? ((currentTime - startTime) / effectiveDuration) * 100 : 0;

  return (
    <Stack gap={2} w="full" p={2}>
      <audio
        ref={audioRef}
        src={blobUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />

      <HStack gap={3} alignItems="center">
        <Button
          size="sm"
          variant="solid"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </Button>

        {/* Progress bar */}
        <Box
          onClick={handleSeek}
          cursor="pointer"
          position="relative"
          flex={1}
          borderRadius="full"
          h="8px"
          bg="bg.subtle"
          overflow="hidden"
        >
          <Box
            style={{ width: `${progressPercentage}%` }}
            borderRadius="full"
            h="full"
            bg="accent.default"
            transition="width 0.1s ease-out"
          />
        </Box>

        {/* Time display */}
        <Text minW="80px" fontFamily="mono" fontSize="xs" textAlign="right">
          {formatTime(currentTime - startTime)} / {formatTime(effectiveDuration)}
        </Text>
      </HStack>
    </Stack>
  );
}
