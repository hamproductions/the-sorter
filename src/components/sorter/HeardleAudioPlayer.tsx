import { useCallback, useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa6';
import { Box, HStack, Stack } from 'styled-system/jsx';
import { Button } from '../ui/button';
import { Text } from '../ui/text';

interface HeardleAudioPlayerProps {
  blobUrl: string | null;
  maxDuration: number; // in seconds
}

// Format time as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function HeardleAudioPlayer({ blobUrl, maxDuration }: HeardleAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Effective duration is the minimum of actual audio length and max allowed duration
  const effectiveDuration = Math.min(duration, maxDuration);

  // Reset state when blob URL changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, [blobUrl]);

  // Handle audio metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Handle time update - enforce max duration
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      // Stop playback when max duration is reached
      if (time >= maxDuration) {
        audioRef.current.pause();
        audioRef.current.currentTime = maxDuration;
        setCurrentTime(maxDuration);
        setIsPlaying(false);
      }
    }
  }, [maxDuration]);

  // Handle play/pause toggle
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If at or past max duration, restart from beginning
      if (audioRef.current.currentTime >= maxDuration) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying, maxDuration]);

  // Handle audio ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Handle seeking - prevent seeking beyond max duration
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const seekTime = Math.min(percentage * effectiveDuration, maxDuration);

      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    },
    [effectiveDuration, maxDuration]
  );

  if (!blobUrl) {
    return (
      <Stack alignItems="center" p={4}>
        <Text color="fg.muted">Loading audio...</Text>
      </Stack>
    );
  }

  const progressPercentage = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

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
          {formatTime(currentTime)} / {formatTime(effectiveDuration)}
        </Text>
      </HStack>
    </Stack>
  );
}
