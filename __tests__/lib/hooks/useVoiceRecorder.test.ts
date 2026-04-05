import { renderHook, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import useVoiceRecorder from '../../../lib/hooks/useVoiceRecorder';
import { VoiceRecorderCallbacks } from '../../../lib/types';
import { AUDIO_MODE_RECORD } from '../../../lib/constants';

jest.mock('expo-av');

describe('useVoiceRecorder', () => {
  let onStatusUpdate: ((status: any) => void) | null;

  const createMockRecording = () => ({
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    startAsync: jest.fn().mockResolvedValue(undefined),
    stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
    getURI: jest.fn(() => 'file://test-recording.m4a'),
    setOnRecordingStatusUpdate: jest.fn((cb: any) => {
      onStatusUpdate = cb;
    }),
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    onStatusUpdate = null;

    (Audio.Recording as unknown as jest.Mock).mockImplementation(() => createMockRecording());
    (Audio.setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with idle status and null URI', () => {
    const { result } = renderHook(() => useVoiceRecorder());

    expect(result.current.recordingStatus).toBe('idle');
    expect(result.current.recordingUri).toBeNull();
    expect(result.current.speechStartMs).toBe(0);
    expect(result.current.speechEndMs).toBe(0);
  });

  it('should transition to monitoring on startMonitoring', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    expect(result.current.recordingStatus).toBe('monitoring');
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith(AUDIO_MODE_RECORD);
  });

  it('should transition to recording immediately when voice detected', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    await act(async () => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    expect(result.current.recordingStatus).toBe('recording');
  });

  it('should stop recording after silence timeout', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    await act(async () => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    expect(result.current.recordingStatus).toBe('recording');

    act(() => {
      onStatusUpdate?.({ isRecording: true, metering: -50 });
    });

    await act(async () => {
      jest.advanceTimersByTime(1600);
    });

    expect(result.current.recordingStatus).toBe('stopped');
    expect(result.current.recordingUri).toBe('file://test-recording.m4a');
  });

  it('should calculate speechStartMs when recording stops', async () => {
    const now = 10000;
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(now)       // monitoringStartTimeRef in startMonitoring
      .mockReturnValueOnce(now + 2000); // voiceDetectedTimeRef on voice detection

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    await act(async () => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    act(() => {
      onStatusUpdate?.({ isRecording: true, metering: -50 });
    });

    await act(async () => {
      jest.advanceTimersByTime(1600);
    });

    expect(result.current.recordingStatus).toBe('stopped');
    // offset = 2000 - 500 = 1500
    expect(result.current.speechStartMs).toBe(1500);

    jest.restoreAllMocks();
  });

  it('should calculate speechEndMs using last voice time', async () => {
    const now = 10000;
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(now)         // monitoringStartTimeRef in startMonitoring
      .mockReturnValueOnce(now + 2000)  // voiceDetectedTimeRef on voice detection
      .mockReturnValueOnce(now + 2000)  // lastVoiceTimeRef on voice detection
      .mockReturnValueOnce(now + 3000)  // lastVoiceTimeRef on continued voice
      .mockReturnValueOnce(now + 3000); // lastVoiceTimeRef on continued voice (clearSilenceTimer re-read)

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    // Voice detected
    await act(async () => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    // Voice continues at now + 3000
    act(() => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    // Silence → triggers timeout
    act(() => {
      onStatusUpdate?.({ isRecording: true, metering: -50 });
    });

    await act(async () => {
      jest.advanceTimersByTime(1600);
    });

    expect(result.current.recordingStatus).toBe('stopped');
    // speechEndMs = lastVoiceTime(now+3000) - monitoringStart(now) + POST_ROLL_BUFFER(200) = 3200
    expect(result.current.speechEndMs).toBe(3200);

    jest.restoreAllMocks();
  });

  it('should reset to idle on stopAll', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    await act(async () => {
      await result.current.stopAll();
    });

    expect(result.current.recordingStatus).toBe('idle');
    expect(result.current.recordingUri).toBeNull();
  });

  it('should reset recording status to idle', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    expect(result.current.recordingStatus).toBe('monitoring');

    act(() => {
      result.current.resetRecordingStatus();
    });

    expect(result.current.recordingStatus).toBe('idle');
  });

  it('should clear silence timer if voice resumes', async () => {
    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startMonitoring();
    });

    await act(async () => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    expect(result.current.recordingStatus).toBe('recording');

    act(() => {
      onStatusUpdate?.({ isRecording: true, metering: -50 });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    act(() => {
      onStatusUpdate?.({ isRecording: true, metering: -10 });
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current.recordingStatus).toBe('recording');
  });

  describe('callbacks', () => {
    it('should call onVoiceDetected when voice is detected', async () => {
      const callbacks: VoiceRecorderCallbacks = {
        onVoiceDetected: jest.fn(),
        onRecordingStopped: jest.fn(),
      };

      const { result } = renderHook(() => useVoiceRecorder(callbacks));

      await act(async () => {
        await result.current.startMonitoring();
      });

      await act(async () => {
        onStatusUpdate?.({ isRecording: true, metering: -10 });
      });

      expect(callbacks.onVoiceDetected).toHaveBeenCalledTimes(1);
    });

    it('should not call onVoiceDetected during continued recording', async () => {
      const callbacks: VoiceRecorderCallbacks = {
        onVoiceDetected: jest.fn(),
      };

      const { result } = renderHook(() => useVoiceRecorder(callbacks));

      await act(async () => {
        await result.current.startMonitoring();
      });

      // First voice detection
      await act(async () => {
        onStatusUpdate?.({ isRecording: true, metering: -10 });
      });

      // Continued voice (already in recording state)
      act(() => {
        onStatusUpdate?.({ isRecording: true, metering: -10 });
      });

      expect(callbacks.onVoiceDetected).toHaveBeenCalledTimes(1);
    });

    it('should call onRecordingStopped with URI and speech offsets when recording stops', async () => {
      const now = 10000;
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now)         // monitoringStartTimeRef in startMonitoring
        .mockReturnValueOnce(now + 2000)  // voiceDetectedTimeRef on voice detection
        .mockReturnValueOnce(now + 2000); // lastVoiceTimeRef on voice detection

      const callbacks: VoiceRecorderCallbacks = {
        onVoiceDetected: jest.fn(),
        onRecordingStopped: jest.fn(),
      };

      const { result } = renderHook(() => useVoiceRecorder(callbacks));

      await act(async () => {
        await result.current.startMonitoring();
      });

      await act(async () => {
        onStatusUpdate?.({ isRecording: true, metering: -10 });
      });

      act(() => {
        onStatusUpdate?.({ isRecording: true, metering: -50 });
      });

      await act(async () => {
        jest.advanceTimersByTime(1600);
      });

      expect(callbacks.onRecordingStopped).toHaveBeenCalledTimes(1);
      expect(callbacks.onRecordingStopped).toHaveBeenCalledWith(
        'file://test-recording.m4a',
        1500, // offset = 2000 - 500 = 1500
        2200, // endOffset = 2000 + 200 = 2200
      );

      jest.restoreAllMocks();
    });

    it('should work without callbacks (undefined)', async () => {
      const { result } = renderHook(() => useVoiceRecorder());

      await act(async () => {
        await result.current.startMonitoring();
      });

      await act(async () => {
        onStatusUpdate?.({ isRecording: true, metering: -10 });
      });

      // Should not throw
      expect(result.current.recordingStatus).toBe('recording');
    });
  });
});
