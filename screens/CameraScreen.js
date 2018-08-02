/* eslint-disable complexity*/
import Expo, { AR } from 'expo';
import ExpoTHREE, { THREE } from 'expo-three';
import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';

import GraphicsView from '../components/GraphicsView';
import * as ThreeAR from '../ThreeAR';

window.navigator.userAgent = 'react-native';
import io from 'socket.io-client';


class CameraScreen extends React.Component {
  constructor() {
    super();

    const connectionConfig = {
      jsonp: false,
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionAttempts: 100000,
      transports: ['websocket']
    };

    this.socket = io('http://172.16.21.255:3000', connectionConfig);

  }

  blinked = () => {
    console.log('BLINKED');
    this.socket.emit('blinked');
  }

  smiled = () => {
    console.log('SMILED');
    this.socket.emit('smiled');
  }

  state = {
    numBlinks: 0,
    justBlinked: false,
    justSmiled: false,
    gamePlay: false
  };

  async componentDidMount() {
    const hasFace = anchors => {
      for (let anchor of anchors) {
        if (anchor.type === AR.AnchorTypes.Face) {
          return true;
        }
      }
    };
    AR.onAnchorsDidUpdate(({ anchors, eventType }) => {
      // (EvanBacon): I don't think you can track more than one face but, better to be safe than sorry I guess...
      if (hasFace(anchors)) {
        /*
        After we know a face anchor is found, we can request frame data regarding the face.
        There is a lot of data so here we are just getting 2 blendShapes.
        If you just return `true` it will get everything.
        You can also get the geometry but I don't recommend this as it's experimental.
        */
        const frame = AR.getCurrentFrame({
          anchors: {
            [AR.AnchorTypes.Face]: {
              // geometry: true,
              blendShapes: [AR.BlendShapes.EyeBlinkR, AR.BlendShapes.EyeBlinkL, AR.BlendShapes.MouthSmileL, AR.BlendShapes.MouthSmileR],
            },
          },
        });
        for (let anchor of frame.anchors) {
          if (anchor.type === AR.AnchorTypes.Face) {
            this.handleFace(anchor, eventType);
          }
        }
      }
    });

  }

  toggleGame = () => {
    console.log('GAME STATE CHANGED')
    this.setState({gamePlay: !this.state.gamePlay});
  }

  playSound = async () => {
    const soundObject = new Expo.Audio.Sound();
    Expo.Audio.setIsEnabledAsync(true);
    try {
      await soundObject.loadAsync(require('../assets/sounds/beep.mp3'));
      await soundObject.playAsync();
    } catch (err) {
      console.log(err);
    }
  }

  handleFace = (anchor, eventType) => {
    const { blendShapes } = anchor;

    const {
      [AR.BlendShapes.EyeBlinkR]: leftEyebrow,
      [AR.BlendShapes.EyeBlinkL]: rightEyebrow,
      [AR.BlendShapes.MouthSmileL]: rightSmile,
      [AR.BlendShapes.MouthSmileR]: leftSmile,
    } = blendShapes;

    const isBlinking = leftEyebrow > 0.25 || rightEyebrow > 0.25;
    const isSmiling = (rightSmile + leftSmile) > 0.5;

    if (this.state.gamePlay) {
      if ((isBlinking && !this.state.justBlinked) || (isSmiling  && !this.state.justSmiled)) {
        this.playSound();
        if (isBlinking) {
          this.blinked();
          this.setState((state) => {
            return {
              numBlinks: state.numBlinks + 1,
              justBlinked: true
            };
          });
        } else if (isSmiling) {
          this.smiled();
          this.setState({justSmiled: true});
        }
      } else if (!isBlinking || !isSmiling) {
        this.setState({
          justBlinked: isBlinking,
          justSmiled: isSmiling
        });
      }
    }

    this.setState({ ...blendShapes, isBlinking, isSmiling });

  };

  componentWillUnmount() {
    AR.removeAllListeners(AR.EventTypes.AnchorsDidUpdate);
  }

  render() {
    const config = AR.TrackingConfigurations.Face;

    const {
      [AR.BlendShapes.EyeBlinkR]: leftEyebrow,
      [AR.BlendShapes.EyeBlinkL]: rightEyebrow,
      [AR.BlendShapes.MouthSmileL]: rightSmile,
      [AR.BlendShapes.MouthSmileR]: leftSmile,
    } = this.state;

    const message = `You are blinking! You've blinked ${this.state.numBlinks} times.`;

    return (
      <View style={{ flex: 1 }}>
        <GraphicsView
          style={{ flex: 1 }}
          onContextCreate={this.onContextCreate}
          onRender={this.onRender}
          onResize={this.onResize}
          trackingConfiguration={config}
          arEnabled
        />
        <View>
          {
            !this.state.gamePlay ? <Button title="PLAY" onPress={this.toggleGame} /> :
            <Button title="PAUSE" onPress={this.toggleGame} />
          }
        </View>
        <View style={styles.infoContainer}>
          <InfoBox title="Left Eye">{leftEyebrow}</InfoBox>
          <InfoBox title="Right Eye">{rightEyebrow}</InfoBox>
          <InfoBox title="Left Smile">{leftSmile}</InfoBox>
          <InfoBox title="Right Smile">{rightSmile}</InfoBox>
        </View>
        {(this.state.isBlinking && this.state.gamePlay) && <Text style={styles.coolMessage}>{message}</Text>}
        {(this.state.isSmiling && this.state.gamePlay) && <Text style={styles.coolMessage}>You're Smiling!</Text>}
      </View>
    );
  }

  onContextCreate = async event => {
    this.commonSetup(event);
  };

  commonSetup = ({ gl, scale, width, height }) => {
    this.renderer = ExpoTHREE.renderer({ gl });
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0xffffff, 1.0);

    this.scene = new THREE.Scene();
    this.scene.background = ThreeAR.createARBackgroundTexture(this.renderer);

    this.camera = ThreeAR.createARCamera(width, height, 0.01, 1000);
  };

  onResize = ({ x, y, scale, width, height }) => {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width, height);
  };

  onRender = () => {
    this.renderer.render(this.scene, this.camera);
  };
}

const InfoBox = (props) =>  {
    const { title, children } = props;
    let value = (children || 0).toFixed(2);
    return (
      <View style={styles.infoBoxContainer}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle}>{value}</Text>
      </View>
    );
};


const styles = StyleSheet.create({
  infoContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '10%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBoxContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoTitle: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  infoSubtitle: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
  },
  coolMessage: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
    position: 'absolute',
    left: 24,
    right: 24,
    padding: 24,
    backgroundColor: 'white',
    bottom: '10%',
  },
});

export default CameraScreen;
