import React from 'react';

const Rive = React.forwardRef((props: any, ref: any) => {
  React.useImperativeHandle(ref, () => ({
    fireState: jest.fn(),
    setInputState: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
  }));
  return React.createElement('View', { testID: 'rive-character', ...props });
});

Rive.displayName = 'Rive';

export default Rive;
export const useStateMachineInput = jest.fn();
export const Fit = { Cover: 'cover', Contain: 'contain' };
export const Alignment = { Center: 'center' };
export const RNRiveError = {};
