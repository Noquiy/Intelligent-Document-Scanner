import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Button, Image, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Camera } from 'expo-camera';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import axios from 'axios';

export default function App() {
  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
  const [photo, setPhoto] = useState();
  const navigation = useNavigation();

  const goToMainMenu = () => {
    navigation.navigate('MainMenu');
  }


  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
      let ratios = await cameraRef.current.getSupportedRatiosAsync();

    })();
  }, []);

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions...</Text>
  } else if (!hasCameraPermission) {
    return <Text>Permission for camera not granted. Please change this in settings.</Text>
  }

  let takePic = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false
    };

    let newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto);
    await uploadPhoto();
  };

  let uploadPhoto = async () => {
    let localUri = photo.uri;
    let filename = localUri.split('/').pop();

    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : 'image'

    let formData = new FormData();
    formData.append('photo', {uri: localUri, name: filename, type});

    try {
      let response = await axios({
        method: 'POST',
        url: 'http://192.168.5.120:3000/upload',
        data: formData,
        headers: {
          'Content-Type' : 'multipart/form-data',
        },
      });
      console.log(response);
    } catch (error) {
      console.error('There has been a problem with uploading the photo', error);
    }
  };

  if (photo) {
    let savePhoto = () => {
      MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {
        setPhoto(undefined);
      });
    };

    let discardPhoto = () => {
      setPhoto(undefined);
    };

    return (
      <SafeAreaView style={styles.container}>
        <Image style={styles.preview} source={{ uri: "data:image/jpg;base64," + photo.base64 }} />
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.saveDiscardButton} onPress={uploadPhoto}>
            <Ionicons name='checkmark-sharp' size={36} color='white'/>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveDiscardButton} onPress={discardPhoto}>
            <Ionicons name="reload-sharp" size={36} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef} ratio='16:9'>
      <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={takePic}>
        <Ionicons name="camera-outline" size={36} color="white" />
      </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </Camera>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    borderRadius: 30,
    backgroundColor: '#AA1313',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    position: 'absolute',
    bottom: 40,
  },
  saveDiscardButton: {
    borderRadius: 30,
    backgroundColor: '#AA1313',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  preview: {
    alignSelf: 'stretch',
    flex: 1
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 40,
  },
});
