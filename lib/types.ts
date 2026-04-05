export type CharacterState = 'idle' | 'hear' | 'talk';

export type RecordingStatus = 'idle' | 'monitoring' | 'recording' | 'stopped';

export type PlaybackStatus = 'idle' | 'playing' | 'finished';

export type MicPermissionStatus = 'loading' | 'undetermined' | 'granted' | 'denied';

export interface VoiceRecorderCallbacks {
  onVoiceDetected?: () => void;
  onRecordingStopped?: (uri: string, speechStartMs: number, speechEndMs: number) => void;
}

export interface AudioPlaybackCallbacks {
  onPlaybackStarted?: () => void;
  onPlaybackFinished?: () => void;
}

export interface VoiceRecorderResult {
  recordingStatus: RecordingStatus;
  recordingUri: string | null;
  speechStartMs: number;
  speechEndMs: number;
  startMonitoring: () => Promise<void>;
  stopAll: () => Promise<void>;
  resetRecordingStatus: () => void;
}

export interface AudioPlaybackResult {
  playbackStatus: PlaybackStatus;
  playRecording: (uri: string, startPositionMs?: number, endPositionMs?: number) => Promise<void>;
  stopPlayback: () => Promise<void>;
  resetStatus: () => void;
}

export interface MicPermissionResult {
  status: MicPermissionStatus;
  requestPermission: () => Promise<MicPermissionStatus>;
}

export interface TalkingTomFlowResult {
  characterState: CharacterState;
  permissionStatus: MicPermissionStatus;
  requestPermission: () => Promise<void>;
}
