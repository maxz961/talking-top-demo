import { useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import useMicPermission from './useMicPermission';
import useVoiceRecorder from './useVoiceRecorder';
import useAudioPlayback from './useAudioPlayback';
import { flowReducer, initialFlowState } from './flowReducer';
import { TalkingTomFlowResult } from '../types';


const useTalkingTomFlow = (): TalkingTomFlowResult => {
  const { status: permissionStatus, requestPermission: requestMicPermission } = useMicPermission();

  const [state, dispatch] = useReducer(flowReducer, initialFlowState);

  const pendingRecordingRef = useRef<{
    uri: string;
    speechStartMs: number;
    speechEndMs: number;
  } | null>(null);

  const voiceRecorderCallbacks = useMemo(() => ({
    onVoiceDetected: () => {
      dispatch({ type: 'VOICE_DETECTED' });
    },
    onRecordingStopped: (uri: string, speechStartMs: number, speechEndMs: number) => {
      pendingRecordingRef.current = { uri, speechStartMs, speechEndMs };
      dispatch({ type: 'RECORDING_STOPPED', uri, speechStartMs, speechEndMs });
    },
  }), []);

  const playbackCallbacks = useMemo(() => ({
    onPlaybackStarted: () => {
      dispatch({ type: 'PLAYBACK_STARTED' });
    },
    onPlaybackFinished: () => {
      dispatch({ type: 'PLAYBACK_FINISHED' });
    },
  }), []);

  const { startMonitoring } = useVoiceRecorder(voiceRecorderCallbacks);
  const { playRecording } = useAudioPlayback(playbackCallbacks);

  console.log('[FLOW] phase:', state.phase, '| character:', state.characterState);

  // Side effects based on phase transitions
  useEffect(() => {
    if (state.phase === 'monitoring') {
      startMonitoring();
    } else if (state.phase === 'playing' && state.characterState === 'hear') {
      const pending = pendingRecordingRef.current;
      if (pending) {
        console.log('[FLOW] → playRecording()', pending.uri, 'from:', pending.speechStartMs, 'to:', pending.speechEndMs);
        playRecording(pending.uri, pending.speechStartMs, pending.speechEndMs);
        pendingRecordingRef.current = null;
      }
    }
  }, [state.phase, state.characterState, startMonitoring, playRecording]);

  // Permission granted → transition to monitoring
  useEffect(() => {
    if (permissionStatus === 'granted') {
      dispatch({ type: 'PERMISSION_GRANTED' });
    }
  }, [permissionStatus]);

  const requestPermission = useCallback(async () => {
    await requestMicPermission();
  }, [requestMicPermission]);

  return {
    characterState: state.characterState,
    permissionStatus,
    requestPermission,
  };
};

export default useTalkingTomFlow;
