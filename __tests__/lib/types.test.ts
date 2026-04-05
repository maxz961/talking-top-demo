import {
  CharacterState,
  RecordingStatus,
  PlaybackStatus,
  MicPermissionStatus,
  VoiceRecorderResult,
  AudioPlaybackResult,
  MicPermissionResult,
  TalkingTomFlowResult,
} from '../../lib/types';

describe('types', () => {
  it('should have valid CharacterState values', () => {
    const states: CharacterState[] = ['idle', 'hear', 'talk'];
    expect(states).toHaveLength(3);
  });

  it('should have valid RecordingStatus values', () => {
    const statuses: RecordingStatus[] = ['idle', 'monitoring', 'recording', 'stopped'];
    expect(statuses).toHaveLength(4);
  });

  it('should have valid PlaybackStatus values', () => {
    const statuses: PlaybackStatus[] = ['idle', 'playing', 'finished'];
    expect(statuses).toHaveLength(3);
  });

  it('should have valid MicPermissionStatus values', () => {
    const statuses: MicPermissionStatus[] = ['undetermined', 'granted', 'denied'];
    expect(statuses).toHaveLength(3);
  });
});
