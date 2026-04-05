import React from 'react';
import { render } from '@testing-library/react-native';
import Character from '../../../components/Character';

jest.mock('rive-react-native');

describe('Character', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(<Character state="idle" />);
    expect(getByTestId('rive-character')).toBeTruthy();
  });

  it('should render with hear state', () => {
    const { getByTestId } = render(<Character state="hear" />);
    expect(getByTestId('rive-character')).toBeTruthy();
  });

  it('should render with talk state', () => {
    const { getByTestId } = render(<Character state="talk" />);
    expect(getByTestId('rive-character')).toBeTruthy();
  });
});
