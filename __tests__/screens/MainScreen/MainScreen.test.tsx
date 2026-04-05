import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MainScreen from '../../../screens/MainScreen';
import useTalkingTomFlow from '../../../lib/hooks/useTalkingTomFlow';

jest.mock('rive-react-native');
jest.mock('../../../lib/hooks/useTalkingTomFlow');

const mockUseTalkingTomFlow = useTalkingTomFlow as jest.MockedFunction<typeof useTalkingTomFlow>;


describe('MainScreen', () => {
  const mockRequestPermission = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'idle',
      permissionStatus: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { getByTestId } = render(<MainScreen />);
    expect(getByTestId('rive-character')).toBeTruthy();
  });

  it('should not show modal when loading', () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'idle',
      permissionStatus: 'loading',
      requestPermission: mockRequestPermission,
    });

    const { queryByText } = render(<MainScreen />);
    expect(queryByText('Я тебе не чую! Дай дозвіл, щоб я тебе почув')).toBeNull();
    expect(queryByText('Мікрофон вимкнено. Зайди в налаштування та дозволь доступ')).toBeNull();
  });

  it('should show permission modal when undetermined', () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'idle',
      permissionStatus: 'undetermined',
      requestPermission: mockRequestPermission,
    });

    const { getByText } = render(<MainScreen />);
    expect(getByText('Я тебе не чую! Дай дозвіл, щоб я тебе почув')).toBeTruthy();
    expect(getByText('Дозволити')).toBeTruthy();
  });

  it('should show denied message when denied', () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'idle',
      permissionStatus: 'denied',
      requestPermission: mockRequestPermission,
    });

    const { getByText } = render(<MainScreen />);
    expect(getByText('Мікрофон вимкнено. Зайди в налаштування та дозволь доступ')).toBeTruthy();
    expect(getByText('Відкрити налаштування')).toBeTruthy();
  });

  it('should hide modal when granted', () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'idle',
      permissionStatus: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { queryByText } = render(<MainScreen />);
    expect(queryByText('Я тебе не чую! Дай дозвіл, щоб я тебе почув')).toBeNull();
  });

  it('should call requestPermission when button pressed', async () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'idle',
      permissionStatus: 'undetermined',
      requestPermission: mockRequestPermission,
    });

    const { getByTestId } = render(<MainScreen />);
    fireEvent.press(getByTestId('permission-button'));

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    });
  });

  it('should always render Character component', () => {
    mockUseTalkingTomFlow.mockReturnValue({
      characterState: 'hear',
      permissionStatus: 'granted',
      requestPermission: mockRequestPermission,
    });

    const { getByTestId } = render(<MainScreen />);
    expect(getByTestId('rive-character')).toBeTruthy();
  });
});
