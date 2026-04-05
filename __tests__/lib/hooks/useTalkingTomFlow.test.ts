import { renderHook, act, waitFor } from '@testing-library/react-native';
import useTalkingTomFlow from '../../../lib/hooks/useTalkingTomFlow';
import useMicPermission from '../../../lib/hooks/useMicPermission';
import useVoiceRecorder from '../../../lib/hooks/useVoiceRecorder';
import useAudioPlayback from '../../../lib/hooks/useAudioPlayback';
import { VoiceRecorderCallbacks, AudioPlaybackCallbacks } from '../../../lib/types';

jest.mock('../../../lib/hooks/useMicPermission');
jest.mock('../../../lib/hooks/useVoiceRecorder');
jest.mock('../../../lib/hooks/useAudioPlayback');

const mockUseMicPermission = useMicPermission as jest.MockedFunction<typeof useMicPermission>;
const mockUseVoiceRecorder = useVoiceRecorder as jest.MockedFunction<typeof useVoiceRecorder>;
const mockUseAudioPlayback = useAudioPlayback as jest.MockedFunction<typeof useAudioPlayback>;

describe('useTalkingTomFlow', () => {
  const mockStartMonitoring = jest.fn().mockResolvedValue(undefined);
  const mockStopAll = jest.fn().mockResolvedValue(undefined);
  const mockPlayRecording = jest.fn().mockResolvedValue(undefined);
  const mockStopPlayback = jest.fn().mockResolvedValue(undefined);
  const mockRequestPermission = jest.fn().mockResolvedValue('granted');
  const mockResetStatus = jest.fn();
  const mockResetRecordingStatus = jest.fn();

  let capturedVoiceCallbacks: VoiceRecorderCallbacks | undefined;
  let capturedPlaybackCallbacks: AudioPlaybackCallbacks | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedVoiceCallbacks = undefined;
    capturedPlaybackCallbacks = undefined;

    mockUseMicPermission.mockReturnValue({
      status: 'loading',
      requestPermission: mockRequestPermission,
    });

    mockUseVoiceRecorder.mockImplementation((callbacks?: VoiceRecorderCallbacks) => {
      capturedVoiceCallbacks = callbacks;
      return {
        recordingStatus: 'idle',
        recordingUri: null,
        speechStartMs: 0,
        speechEndMs: 0,
        startMonitoring: mockStartMonitoring,
        stopAll: mockStopAll,
        resetRecordingStatus: mockResetRecordingStatus,
      };
    });

    mockUseAudioPlayback.mockImplementation((callbacks?: AudioPlaybackCallbacks) => {
      capturedPlaybackCallbacks = callbacks;
      return {
        playbackStatus: 'idle',
        playRecording: mockPlayRecording,
        stopPlayback: mockStopPlayback,
        resetStatus: mockResetStatus,
      };
    });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useTalkingTomFlow());

    expect(result.current.characterState).toBe('idle');
    expect(result.current.permissionStatus).toBe('loading');
  });

  it('should not start monitoring without permission', () => {
    renderHook(() => useTalkingTomFlow());

    expect(mockStartMonitoring).not.toHaveBeenCalled();
  });

  it('should start monitoring when permission is granted', async () => {
    mockUseMicPermission.mockReturnValue({
      status: 'granted',
      requestPermission: mockRequestPermission,
    });

    renderHook(() => useTalkingTomFlow());

    await waitFor(() => {
      expect(mockStartMonitoring).toHaveBeenCalledTimes(1);
    });
  });

  it('should set character to hear when voice detected via callback', async () => {
    mockUseMicPermission.mockReturnValue({
      status: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { result } = renderHook(() => useTalkingTomFlow());

    // Wait for monitoring to start
    await waitFor(() => {
      expect(mockStartMonitoring).toHaveBeenCalled();
    });

    // Simulate voice detection via callback
    act(() => {
      capturedVoiceCallbacks?.onVoiceDetected?.();
    });

    expect(result.current.characterState).toBe('hear');
  });

  it('should play recording when recording stops via callback', async () => {
    mockUseMicPermission.mockReturnValue({
      status: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { result } = renderHook(() => useTalkingTomFlow());

    await waitFor(() => {
      expect(mockStartMonitoring).toHaveBeenCalled();
    });

    // Voice detected
    act(() => {
      capturedVoiceCallbacks?.onVoiceDetected?.();
    });

    expect(result.current.characterState).toBe('hear');

    // Recording stopped with URI
    act(() => {
      capturedVoiceCallbacks?.onRecordingStopped?.('file://test.m4a', 1000, 5000);
    });

    await waitFor(() => {
      expect(mockPlayRecording).toHaveBeenCalledWith('file://test.m4a', 1000, 5000);
    });

    // Character should still be 'hear' during transition (no flicker)
    expect(result.current.characterState).toBe('hear');
  });

  it('should set character to talk when playback starts via callback', async () => {
    mockUseMicPermission.mockReturnValue({
      status: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { result } = renderHook(() => useTalkingTomFlow());

    await waitFor(() => {
      expect(mockStartMonitoring).toHaveBeenCalled();
    });

    // Voice detected → recording → recording stopped
    act(() => {
      capturedVoiceCallbacks?.onVoiceDetected?.();
    });

    act(() => {
      capturedVoiceCallbacks?.onRecordingStopped?.('file://test.m4a', 1000, 5000);
    });

    // Playback started
    act(() => {
      capturedPlaybackCallbacks?.onPlaybackStarted?.();
    });

    expect(result.current.characterState).toBe('talk');
  });

  it('should restart monitoring when playback finishes via callback', async () => {
    mockUseMicPermission.mockReturnValue({
      status: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { result } = renderHook(() => useTalkingTomFlow());

    await waitFor(() => {
      expect(mockStartMonitoring).toHaveBeenCalled();
    });

    mockStartMonitoring.mockClear();

    // Full cycle: voice → record → play → finish
    act(() => {
      capturedVoiceCallbacks?.onVoiceDetected?.();
    });

    act(() => {
      capturedVoiceCallbacks?.onRecordingStopped?.('file://test.m4a', 1000, 5000);
    });

    act(() => {
      capturedPlaybackCallbacks?.onPlaybackStarted?.();
    });

    act(() => {
      capturedPlaybackCallbacks?.onPlaybackFinished?.();
    });

    expect(result.current.characterState).toBe('idle');

    await waitFor(() => {
      expect(mockStartMonitoring).toHaveBeenCalled();
    });
  });

  it('should expose requestPermission', async () => {
    const { result } = renderHook(() => useTalkingTomFlow());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('should pass callbacks to sub-hooks', () => {
    renderHook(() => useTalkingTomFlow());

    expect(capturedVoiceCallbacks).toBeDefined();
    expect(capturedVoiceCallbacks?.onVoiceDetected).toBeInstanceOf(Function);
    expect(capturedVoiceCallbacks?.onRecordingStopped).toBeInstanceOf(Function);

    expect(capturedPlaybackCallbacks).toBeDefined();
    expect(capturedPlaybackCallbacks?.onPlaybackStarted).toBeInstanceOf(Function);
    expect(capturedPlaybackCallbacks?.onPlaybackFinished).toBeInstanceOf(Function);
  });
});
