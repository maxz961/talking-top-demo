import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { RecordingStatus, VoiceRecorderResult, VoiceRecorderCallbacks } from '../types';
import {
  VOLUME_THRESHOLD_DB,
  SILENCE_TIMEOUT_MS,
  AUDIO_MODE_RECORD,
  PRE_ROLL_BUFFER_MS,
  POST_ROLL_BUFFER_MS,
} from '../constants';


const useVoiceRecorder = (callbacks?: VoiceRecorderCallbacks): VoiceRecorderResult => {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [speechStartMs, setSpeechStartMs] = useState<number>(0);
  const [speechEndMs, setSpeechEndMs] = useState<number>(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<RecordingStatus>('idle');
  const monitoringStartTimeRef = useRef<number>(0);
  const voiceDetectedTimeRef = useRef<number>(0);
  const lastVoiceTimeRef = useRef<number>(0);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    clearSilenceTimer();

    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('[RECORDER] stopped, uri:', uri);
      recordingRef.current = null;

      const offset = voiceDetectedTimeRef.current - monitoringStartTimeRef.current - PRE_ROLL_BUFFER_MS;
      const startMs = Math.max(0, offset);
      setSpeechStartMs(startMs);

      const endOffset = lastVoiceTimeRef.current - monitoringStartTimeRef.current + POST_ROLL_BUFFER_MS;
      const endMs = Math.max(0, endOffset);
      setSpeechEndMs(endMs);

      const resolvedUri = uri ?? null;
      setRecordingUri(resolvedUri);
      setRecordingStatus('stopped');
      statusRef.current = 'stopped';

      if (resolvedUri) {
        callbacksRef.current?.onRecordingStopped?.(resolvedUri, startMs, endMs);
      }
    } catch {
      recordingRef.current = null;
      setRecordingStatus('idle');
      statusRef.current = 'idle';
    }
  }, [clearSilenceTimer]);

  const handleRecordingStatus = useCallback(
    (status: Audio.RecordingStatus) => {
      if (!status.isRecording) return;

      const metering = status.metering ?? -160;
      const currentStatus = statusRef.current;

      if (currentStatus === 'monitoring' && metering > VOLUME_THRESHOLD_DB) {
        console.log('[RECORDER] voice detected! metering:', metering);
        voiceDetectedTimeRef.current = Date.now();
        lastVoiceTimeRef.current = Date.now();
        setRecordingStatus('recording');
        statusRef.current = 'recording';
        clearSilenceTimer();
        callbacksRef.current?.onVoiceDetected?.();
      } else if (currentStatus === 'recording') {
        if (metering > VOLUME_THRESHOLD_DB) {
          clearSilenceTimer();
          lastVoiceTimeRef.current = Date.now();
        } else if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, SILENCE_TIMEOUT_MS);
        }
      }
    },
    [clearSilenceTimer, stopRecording]
  );

  const startMonitoring = useCallback(async () => {
    setRecordingUri(null);
    setSpeechStartMs(0);
    setSpeechEndMs(0);
    clearSilenceTimer();

    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {
        // ignore cleanup errors
      }
      recordingRef.current = null;
    }

    await Audio.setAudioModeAsync(AUDIO_MODE_RECORD);

    const recording = new Audio.Recording();
    recordingRef.current = recording;

    await recording.prepareToRecordAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });
    recording.setOnRecordingStatusUpdate(handleRecordingStatus);
    await recording.startAsync();

    monitoringStartTimeRef.current = Date.now();
    setRecordingStatus('monitoring');
    statusRef.current = 'monitoring';
  }, [clearSilenceTimer, handleRecordingStatus]);

  const stopAll = useCallback(async () => {
    clearSilenceTimer();
    const recording = recordingRef.current;
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // ignore cleanup errors
      }
      recordingRef.current = null;
    }
    setRecordingStatus('idle');
    statusRef.current = 'idle';
    setRecordingUri(null);
  }, [clearSilenceTimer]);

  const resetRecordingStatus = useCallback(() => {
    setRecordingStatus('idle');
    statusRef.current = 'idle';
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, [clearSilenceTimer]);

  return { recordingStatus, recordingUri, speechStartMs, speechEndMs, startMonitoring, stopAll, resetRecordingStatus };
};

export default useVoiceRecorder;
