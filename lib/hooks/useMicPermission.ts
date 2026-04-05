import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { MicPermissionStatus, MicPermissionResult } from '../types';


const mapPermissionStatus = (status: string): MicPermissionStatus => {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
};

const useMicPermission = (): MicPermissionResult => {
  const [status, setStatus] = useState<MicPermissionStatus>('loading');

  useEffect(() => {
    const checkPermission = async () => {
      const { status: currentStatus } = await Audio.getPermissionsAsync();
      setStatus(mapPermissionStatus(currentStatus));
    };
    checkPermission();
  }, []);

  const requestPermission = useCallback(async (): Promise<MicPermissionStatus> => {
    const { status: newStatus } = await Audio.requestPermissionsAsync();
    const mapped = mapPermissionStatus(newStatus);
    setStatus(mapped);
    return mapped;
  }, []);

  return { status, requestPermission };
};

export default useMicPermission;
