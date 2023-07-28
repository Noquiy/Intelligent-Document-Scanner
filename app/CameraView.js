import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, Button, Image, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Camera } from 'expo-camera';
import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

export default function CameraView() {
  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
  const [photo, setPhoto] = useState();
  const [corners, setCorners] = useState();
  const [height, setHeight] = useState();
  const [width, setWidth] = useState();
  const navigation = useNavigation();

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

  const takePic = async () => {
      const options = {
        quality: 1,
        base64: true,
        exif: false
      };

    let newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto);
  };

  let uploadPhoto = async (localUri) => {
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';

    const formData = new FormData();
    formData.append('photo', { uri: localUri, name: filename, type });

    try {
      const response = await axios.post('http://192.168.5.118:3000/upload', formData);
      console.log(response.data); // log the entire response data
      const corners = response.data.coordinates.corners;
      const height = response.data.dimensions.height;
      const width = response.data.dimensions.width;
      navigation.navigate('ImageView', { corners, height, width, imageUri: localUri });
    } catch (error) {
      console.error('There is a problem with uploading the photo', error);
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
        <TouchableOpacity style={styles.saveDiscardButton} onPress={() => uploadPhoto(photo.uri)}>
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
