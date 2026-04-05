import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Rive from 'rive-react-native';
import type { RiveRef } from 'rive-react-native';
import { CharacterProps } from './Character.types';


const STATE_MACHINE_NAME = 'State Machine 1';

const BOOLEAN_MAP: Record<string, Record<string, boolean>> = {
  idle: { Hear: false, Talk: false },
  hear: { Hear: true, Talk: false },
  talk: { Hear: false, Talk: true },
};

const Character: React.FC<CharacterProps> = ({ state }) => {
  const riveRef = useRef<RiveRef>(null);

  useEffect(() => {
    if (!riveRef.current) return;

    const inputs = BOOLEAN_MAP[state];
    if (!inputs) return;

    console.log('[CHARACTER] setting inputs:', state, inputs);

    // Try boolean inputs (setInputState)
    for (const [inputName, value] of Object.entries(inputs)) {
      try {
        riveRef.current.setInputState(STATE_MACHINE_NAME, inputName, value);
      } catch (e) {
        console.log('[CHARACTER] setInputState failed for', inputName, e);
      }
    }

    // Also try firing trigger as fallback
    const triggerName = state === 'hear' ? 'Hear' : state === 'talk' ? 'Talk' : null;
    if (triggerName) {
      try {
        riveRef.current.fireState(STATE_MACHINE_NAME, triggerName);
        console.log('[CHARACTER] fireState OK:', triggerName);
      } catch (e) {
        console.log('[CHARACTER] fireState failed:', e);
      }
    }
  }, [state]);

  const handleStateChanged = (stateMachineName: string, stateName: string) => {
    console.log('[RIVE] state changed:', stateMachineName, '→', stateName);
  };

  return (
    <View style={styles.container}>
      <Rive
        ref={riveRef}
        source={require('../../assets/character.riv')}
        stateMachineName={STATE_MACHINE_NAME}
        style={styles.character}
        autoplay
        testID="rive-character"
        onStateChanged={handleStateChanged}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  character: {
    width: '100%',
    height: '100%',
  },
});

export default Character;
