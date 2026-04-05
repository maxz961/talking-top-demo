import { useState, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { PlaybackStatus, AudioPlaybackResult, AudioPlaybackCallbacks } from '../types';
import {
  PITCH_RATE,
  SHOULD_CORRECT_PITCH,
  AUDIO_MODE_PLAYBACK,
} from '../constants';


const useAudioPlayback = (callbacks?: AudioPlaybackCallbacks): AudioPlaybackResult => {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);
  const endPositionRef = useRef<number>(0);

  const cleanup = useCallback(async () => {
    const sound = soundRef.current;
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        // ignore cleanup errors
      }
      soundRef.current = null;
    }
  }, []);

  const handlePlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      if (endPositionRef.current > 0 && status.positionMillis >= endPositionRef.current) {
        console.log('[PLAYBACK] reached speech end at', status.positionMillis, 'ms');
        setPlaybackStatus('finished');
        cleanup();
        callbacksRef.current?.onPlaybackFinished?.();
        return;
      }

      if (status.didJustFinish) {
        console.log('[PLAYBACK] finished');
        setPlaybackStatus('finished');
        cleanup();
        callbacksRef.current?.onPlaybackFinished?.();
      }
    },
    [cleanup]
  );

  const playRecording = useCallback(
    async (uri: string, startPositionMs?: number, endPositionMs?: number) => {
      await cleanup();
      endPositionRef.current = endPositionMs ?? 0;
      await Audio.setAudioModeAsync(AUDIO_MODE_PLAYBACK);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      );

      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(handlePlaybackStatus);
      await sound.setRateAsync(PITCH_RATE, SHOULD_CORRECT_PITCH);

      if (startPositionMs && startPositionMs > 0) {
        await sound.playFromPositionAsync(startPositionMs);
        console.log('[PLAYBACK] playing from position:', startPositionMs, 'ms with rate:', PITCH_RATE);
      } else {
        await sound.playAsync();
        console.log('[PLAYBACK] playing from start with rate:', PITCH_RATE);
      }

      setPlaybackStatus('playing');
      callbacksRef.current?.onPlaybackStarted?.();
    },
    [cleanup, handlePlaybackStatus]
  );

  const stopPlayback = useCallback(async () => {
    await cleanup();
    setPlaybackStatus('idle');
  }, [cleanup]);

  const resetStatus = useCallback(() => {
    setPlaybackStatus('idle');
  }, []);

  return { playbackStatus, playRecording, stopPlayback, resetStatus };
};

export default useAudioPlayback;
