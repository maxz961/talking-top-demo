export const VOLUME_THRESHOLD_DB = -37;
export const SILENCE_TIMEOUT_MS = 1000;
export const PITCH_RATE = 1.5;
export const SHOULD_CORRECT_PITCH = false;
export const METERING_INTERVAL_MS = 100;
export const PRE_ROLL_BUFFER_MS = 500;
export const POST_ROLL_BUFFER_MS = 200;

// expo-av API: iOS-specific names, Android works without these settings
export const AUDIO_MODE_RECORD = {
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
};

export const AUDIO_MODE_PLAYBACK = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
};
