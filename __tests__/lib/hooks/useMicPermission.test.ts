import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import useMicPermission from '../../../lib/hooks/useMicPermission';

jest.mock('expo-av');

describe('useMicPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with loading status', async () => {
    (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      granted: false,
    });

    const { result } = renderHook(() => useMicPermission());

    expect(result.current.status).toBe('loading');
  });

  it('should transition from loading to undetermined after check', async () => {
    (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      granted: false,
    });

    const { result } = renderHook(() => useMicPermission());

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('undetermined');
    });
  });

  it('should detect already granted permission on mount', async () => {
    (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
    });

    const { result } = renderHook(() => useMicPermission());

    await waitFor(() => {
      expect(result.current.status).toBe('granted');
    });
  });

  it('should request permission and update status to granted', async () => {
    (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      granted: false,
    });
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
    });

    const { result } = renderHook(() => useMicPermission());

    let returnedStatus: string;
    await act(async () => {
      returnedStatus = await result.current.requestPermission();
    });

    expect(returnedStatus!).toBe('granted');
    expect(result.current.status).toBe('granted');
  });

  it('should handle denied permission', async () => {
    (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      granted: false,
    });
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
      granted: false,
    });

    const { result } = renderHook(() => useMicPermission());

    let returnedStatus: string;
    await act(async () => {
      returnedStatus = await result.current.requestPermission();
    });

    expect(returnedStatus!).toBe('denied');
    expect(result.current.status).toBe('denied');
  });

  it('should call Audio.getPermissionsAsync on mount', async () => {
    (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
      granted: false,
    });

    renderHook(() => useMicPermission());

    await waitFor(() => {
      expect(Audio.getPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });
});
