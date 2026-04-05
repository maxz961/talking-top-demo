const mockRecording = {
  prepareToRecordAsync: jest.fn(),
  startAsync: jest.fn(),
  stopAndUnloadAsync: jest.fn(),
  getURI: jest.fn(() => 'file://mock-recording.m4a'),
  setOnRecordingStatusUpdate: jest.fn(),
  getStatusAsync: jest.fn(),
};

const MockRecordingClass = jest.fn(() => mockRecording);

const mockSound = {
  playAsync: jest.fn(),
  playFromPositionAsync: jest.fn(),
  stopAsync: jest.fn(),
  unloadAsync: jest.fn(),
  setRateAsync: jest.fn(),
  setOnPlaybackStatusUpdate: jest.fn(),
};

export const Audio = {
  Recording: MockRecordingClass,
  Sound: {
    createAsync: jest.fn(() => Promise.resolve({ sound: mockSound, status: {} })),
  },
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined', granted: false })),
  setAudioModeAsync: jest.fn(),
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
  },
};

export { mockRecording, mockSound };
