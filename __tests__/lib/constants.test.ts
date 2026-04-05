import {
  VOLUME_THRESHOLD_DB,
  SILENCE_TIMEOUT_MS,
  PITCH_RATE,
  SHOULD_CORRECT_PITCH,
  METERING_INTERVAL_MS,
  PRE_ROLL_BUFFER_MS,
  POST_ROLL_BUFFER_MS,
  AUDIO_MODE_RECORD,
  AUDIO_MODE_PLAYBACK,
} from '../../lib/constants';

describe('constants', () => {
  it('should have correct volume threshold', () => {
    expect(VOLUME_THRESHOLD_DB).toBe(-37);
  });

  it('should have correct silence timeout', () => {
    expect(SILENCE_TIMEOUT_MS).toBe(1000);
  });

  it('should have correct pitch rate', () => {
    expect(PITCH_RATE).toBe(1.5);
  });

  it('should not correct pitch for chipmunk effect', () => {
    expect(SHOULD_CORRECT_PITCH).toBe(false);
  });

  it('should have correct metering interval', () => {
    expect(METERING_INTERVAL_MS).toBe(100);
  });

  it('should have correct pre-roll buffer', () => {
    expect(PRE_ROLL_BUFFER_MS).toBe(500);
  });

  it('should have correct post-roll buffer', () => {
    expect(POST_ROLL_BUFFER_MS).toBe(200);
  });

  it('should enable recording in record mode', () => {
    expect(AUDIO_MODE_RECORD.allowsRecordingIOS).toBe(true);
    expect(AUDIO_MODE_RECORD.playsInSilentModeIOS).toBe(true);
  });

  it('should disable recording in playback mode', () => {
    expect(AUDIO_MODE_PLAYBACK.allowsRecordingIOS).toBe(false);
    expect(AUDIO_MODE_PLAYBACK.playsInSilentModeIOS).toBe(true);
  });
});
