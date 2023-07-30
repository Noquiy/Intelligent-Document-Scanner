import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

export default function CameraView() {
  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [photo, setPhoto] = useState();
  const [corners, setCorners] = useState();
  const [height, setHeight] = useState();
  const [width, setWidth] = useState();
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();

      setHasCameraPermission(cameraPermission.status === "granted");

      let ratios = await cameraRef.current.getSupportedRatiosAsync();

    })();
  }, []);

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions...</Text>
  } else if (!hasCameraPermission) {
    return <Text>Permission for camera not granted. Please change this in settings.</Text>
  }

  const mainMenu = () => {
    navigation.navigate('MainMenu');
  }

  const choosePhotoFromGallery = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3], 
        quality: 1,
      });

      console.log(result);

      if (!result.canceled && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setPhoto(selectedImageUri);
      }
    } catch (error) {
      console.error('Error accessing media library:', error);
    }
  }

  const takePic = async () => {
      const options = {
        quality: 1,
        base64: true,
        exif: false
      };

    let newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto.uri);
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
    <View style={styles.container}>
      <Image style={styles.preview} source={{ uri: photo}} />
      <View style={ styles.mainMenuButton }>
        <TouchableOpacity style={ styles.mainMenuButtonCircle} onPress = { mainMenu }>
          <AntDesign name='left' size={30 } color={'#58B1E4'}></AntDesign>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.saveDiscardButton} onPress={() => uploadPhoto(photo.uri)}>
          <Ionicons name='checkmark-sharp' size={36} color='white'/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveDiscardButton} onPress={discardPhoto}>
          <Ionicons name="reload-sharp" size={36} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

return (
  <View style={styles.container}>
    <Camera style={styles.camera} ref={cameraRef} ratio='16:9'>
      <TouchableOpacity style={styles.mainMenuButton} onPress={mainMenu}>
        <AntDesign name='left' size={30} color={'#58B1E4'}></AntDesign>
      </TouchableOpacity>
      <View style={styles.managePhotoButtons}>
        <TouchableOpacity onPress={takePic}>
          <Ionicons name="camera-outline" size={66} color="white" />
        </TouchableOpacity>
      </View>
      <View style = { styles.manageChoosePhotoFromGallery}>
        <TouchableOpacity onPress={ choosePhotoFromGallery }>
          <Feather name="hard-drive" size={36} color="white"/>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </Camera>
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: "100%",
    width: "100%",
  },
  camera: {
    flex: 1,
    alignSelf: 'stretch',
  },
  mainMenuButton: {
    position: 'absolute',
    top: '8%',
    left: '7%',
  },
  mainMenuButtonCircle: {
    opacity: 100,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  managePhotoButtons: {
    borderRadius: 50,
    backgroundColor: '#58B1E4',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: 90,
    position: 'absolute',
    left: '50%',
    bottom: '5%',
    transform: [{ translateX: -45 }],
  },

  manageChoosePhotoFromGallery: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    position: 'absolute',
    right: '13%',
    bottom: '6.5%',
  },
  saveDiscardButton: {
    borderRadius: 30,
    backgroundColor: '#58B1E4',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  preview: {
    alignSelf: 'stretch',
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 40,
  },
});

