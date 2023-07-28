import React, { useState } from 'react';
import { View, Image } from 'react-native';
import Draggable from 'react-native-draggable';
import { Svg, Line } from 'react-native-svg';
import { useRoute } from '@react-navigation/native';
import { Dimensions } from 'react-native';

export default function ImageView() {
  const route = useRoute();
  const { corners, height, width, imageUri } = route.params;
  console.log(corners, height, width, imageUri);

  const originalImageWidth = width;
  const originalImageHeight = height;

  const deviceWidth = Dimensions.get('window').width;
  const deviceHeight = Dimensions.get('window').height;

  const ratioX = deviceWidth / originalImageWidth;
  const ratioY = deviceHeight / originalImageHeight;  

  const normalizedCorners = corners.map(corner => [
    corner[0] * ratioX,
    corner[1] * ratioY,
  ]);

  const [updatedCorners, setUpdatedCorners] = useState(normalizedCorners);
    const drawLines = () => {
      let lines = [];

      for (let i = 0; i < updatedCorners.length; i++) {
        let nextIndex = (i + 1) % updatedCorners.length;
        lines.push(
          <Line
            key={i}
            x1={updatedCorners[i][0]}
            y1={updatedCorners[i][1]}
            x2={updatedCorners[nextIndex][0]}
            y2={updatedCorners[nextIndex][1]}
            stroke="blue"
            strokeWidth="2"
          />
        );
      }

    return lines;
    };

  return (
    <View style={{ flex: 1 }}>
        <Image style={{ width: '100%', height: '100%', position: 'absolute' }} source={{ uri: imageUri }} />
        <Svg height="100%" width="100%" style={{ position: 'absolute', zIndex: 10 }}>
            {drawLines()}
        </Svg>
        {updatedCorners.map((corner, index) => ( 
            <Draggable
            x={corner[0]}
            y={corner[1]}
            renderSize={36}
            renderColor="blue"
            isCircle
            key={index}
            onRelease={(event, gestureState, bounds) => {
              // Check if the bounds object contains the expected properties
              if (bounds && bounds.left !== undefined && bounds.top !== undefined) {
                let newCorners = [...updatedCorners];
                newCorners[index] = [bounds.left, bounds.top];
                setUpdatedCorners(newCorners);
              }
            }}
          />
        ))}
    </View>
  );
}
