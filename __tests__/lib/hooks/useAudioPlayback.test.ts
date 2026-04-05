import { renderHook, act } from '@testing-library/react-native';
import useAudioPlayback from '../../../lib/hooks/useAudioPlayback';
import { Audio, mockSound } from '../../../__mocks__/expo-av';
import { PITCH_RATE, SHOULD_CORRECT_PITCH, AUDIO_MODE_PLAYBACK } from '../../../lib/constants';

jest.mock('expo-av');

describe('useAudioPlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with idle status', () => {
    const { result } = renderHook(() => useAudioPlayback());
    expect(result.current.playbackStatus).toBe('idle');
  });

  it('should transition to playing when playRecording is called', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    expect(result.current.playbackStatus).toBe('playing');
  });

  it('should set correct pitch rate via setRateAsync', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    expect(mockSound.setRateAsync).toHaveBeenCalledWith(PITCH_RATE, SHOULD_CORRECT_PITCH);
  });

  it('should transition to finished on didJustFinish', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    // Get the status update callback
    const statusCallback = mockSound.setOnPlaybackStatusUpdate.mock.calls[0][0];

    act(() => {
      statusCallback({ isLoaded: true, didJustFinish: true, positionMillis: 5000 });
    });

    expect(result.current.playbackStatus).toBe('finished');
  });

  it('should stop at endPosition when positionMillis reaches it', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a', 0, 3000);
    });

    const statusCallback = mockSound.setOnPlaybackStatusUpdate.mock.calls[0][0];

    act(() => {
      statusCallback({ isLoaded: true, didJustFinish: false, positionMillis: 3000 });
    });

    expect(result.current.playbackStatus).toBe('finished');
    expect(mockSound.unloadAsync).toHaveBeenCalled();
  });

  it('should reset to idle on stopPlayback', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    await act(async () => {
      await result.current.stopPlayback();
    });

    expect(result.current.playbackStatus).toBe('idle');
  });

  it('should reset status to idle', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    act(() => {
      result.current.resetStatus();
    });

    expect(result.current.playbackStatus).toBe('idle');
  });

  it('should play from position when startPositionMs > 0', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a', 2000);
    });

    expect(mockSound.playFromPositionAsync).toHaveBeenCalledWith(2000);
    expect(mockSound.playAsync).not.toHaveBeenCalled();
  });

  it('should play from start when startPositionMs is 0 or undefined', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    expect(mockSound.playAsync).toHaveBeenCalled();
    expect(mockSound.playFromPositionAsync).not.toHaveBeenCalled();
  });

  it('should not stop early when endPositionMs is 0', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a', 0, 0);
    });

    const statusCallback = mockSound.setOnPlaybackStatusUpdate.mock.calls[0][0];

    act(() => {
      statusCallback({ isLoaded: true, didJustFinish: false, positionMillis: 1000 });
    });

    // Should still be playing since endPositionMs is 0 (no end threshold)
    expect(result.current.playbackStatus).toBe('playing');
  });

  it('should call onPlaybackStarted callback', async () => {
    const onPlaybackStarted = jest.fn();
    const { result } = renderHook(() => useAudioPlayback({ onPlaybackStarted }));

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    expect(onPlaybackStarted).toHaveBeenCalledTimes(1);
  });

  it('should call onPlaybackFinished callback', async () => {
    const onPlaybackFinished = jest.fn();
    const { result } = renderHook(() => useAudioPlayback({ onPlaybackFinished }));

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    const statusCallback = mockSound.setOnPlaybackStatusUpdate.mock.calls[0][0];

    act(() => {
      statusCallback({ isLoaded: true, didJustFinish: true, positionMillis: 5000 });
    });

    expect(onPlaybackFinished).toHaveBeenCalledTimes(1);
  });

  it('should switch to playback audio mode', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(AUDIO_MODE_PLAYBACK);
  });

  it('should ignore status updates when not loaded', async () => {
    const { result } = renderHook(() => useAudioPlayback());

    await act(async () => {
      await result.current.playRecording('file://test.m4a');
    });

    const statusCallback = mockSound.setOnPlaybackStatusUpdate.mock.calls[0][0];

    act(() => {
      statusCallback({ isLoaded: false });
    });

    // Should still be playing
    expect(result.current.playbackStatus).toBe('playing');
  });
});
