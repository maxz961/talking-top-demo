import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import Character from '../../components/Character';
import useTalkingTomFlow from '../../lib/hooks/useTalkingTomFlow';
import { styles } from './styles';


const MainScreen: React.FC = () => {
  const { characterState, permissionStatus, requestPermission } = useTalkingTomFlow();
  const showModal = permissionStatus !== 'granted' && permissionStatus !== 'loading';
  const isDenied = permissionStatus === 'denied';

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Character state={characterState} />

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        testID="permission-modal"
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {isDenied
                ? 'Мікрофон вимкнено. Зайди в налаштування та дозволь доступ'
                : 'Я тебе не чую! Дай дозвіл, щоб я тебе почув'}
            </Text>
            <Pressable
              style={styles.button}
              onPress={handleRequestPermission}
              testID="permission-button"
            >
              <Text style={styles.buttonText}>
                {isDenied ? 'Відкрити налаштування' : 'Дозволити'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MainScreen;
