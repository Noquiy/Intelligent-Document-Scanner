import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, TextInput, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CameraView } from './CameraView'

export default function MainMenu() {
  const navigation = useNavigation();
  const [documentsContainerHeight, setDocumentsContainerHeight] = useState(new Animated.Value(88));
  const [menuButtonIcon, setMenuButtonIcon] = useState('menu');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleMenuButtonClick = () => {
    const targetHeight = documentsContainerHeight._value === 88 ? 60 : 88;
    const targetIcon = documentsContainerHeight._value === 88 ? 'close' : 'menu';
    Animated.timing(documentsContainerHeight, {
      toValue: targetHeight,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setMenuButtonIcon(targetIcon);
  };

  const handleNewDocument = () => {
    navigation.navigate('CameraView');
  }

  const animatedContainerStyle = {
    height: documentsContainerHeight.interpolate({
      inputRange: [60, 88],
      outputRange: ['60%', '88%'],
      extrapolate: 'clamp',
    }),
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerTop}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuButtonClick}>
          <Ionicons name={menuButtonIcon} size={36} color="#673C3C" />
        </TouchableOpacity>
        <Text style={styles.copywright}>
           © 2023 Intelligent Scanner by AI Technica
        </Text>
      </View>
      

      <Animated.View style={[styles.documentsContainer, animatedContainerStyle]}>
        <Text style={styles.documentsText}>Ostatnie dokumenty</Text>
        {/* Add your logic to render the last documents here */}
        <View style={styles.separator} />
        {/* Add your logic to render the last documents here */}
      </Animated.View>

      {Platform.OS === 'ios' || Platform.OS === 'android' ? (
        <TouchableOpacity style={styles.button} onPress={handleNewDocument}>
          <Ionicons name="ios-add" size={42} color="white" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAD1D1',
  },
  containerTop: {
    position: 'absolute',
    top: 50,
    zIndex: 1,
    width: '100%',
  },
  menuButton: {
    marginLeft: 20,
  },
  documentsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#E61919',
    marginVertical: 10,
  },
  documentsText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#AA1313',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  copywright: {
    alignSelf: 'center',
    marginTop: 220,
    height: '50%',
    margin: 'auto',
  }
});
