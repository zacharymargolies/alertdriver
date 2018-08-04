/* eslint-disable complexity*/
import Expo, { AR } from 'expo';
import ExpoTHREE, { THREE } from 'expo-three';
import React from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';

import GraphicsView from '../components/GraphicsView';
import * as ThreeAR from '../ThreeAR';

window.navigator.userAgent = 'react-native';
import io from 'socket.io-client';


export default class GameScreen extends React.Component {
  constructor() {
    super();

    const connectionConfig = {
      jsonp: false,
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionAttempts: 100000,
      transports: ['websocket']
    };

    this.socket = io('http://172.16.27.140:3000', connectionConfig);
    this.socket.on('connect', () => {
      console.log('iPhone connected');
    });

    this.socket.on('opponentLost', () => {
      console.log('opponentLost received', this.socket.id);
      this.setState({
        won: true,
        gamePlay: false
      });
      this.playSound(this.sounds.won);
    });

    this.socket.on('opponentNewGame', () => {
      console.log('OPPONENT NEW GAME')
      this.setState({
        numBlinks: 0,
        justBlinked: false,
        justSmiled: false,
        gamePlay: false,
        won: null
      });
    });

    this.socket.on('opponentGamePlay', (opponentGamePlay) => {
      console.log("OPPONENT GAME PLAY CALLED");
      this.setState({
        opponentGamePlay
      });
      console.log('STATE: ', this.state)
    });
  }

  lost = (isBlinking, isSmiling) => {
    if (this.state.won === null) {
      this.socket.emit('lose', {isBlinking, isSmiling});
      this.setState({
        won: false,
        gamePlay: false
      });
      this.playSound(this.sounds.lost);
    }
  }

  state = {
    numBlinks: 0,
    justBlinked: false,
    justSmiled: false,
    gamePlay: false,
    opponentGamePlay: false,
    won: null
  };

  componentDidMount() {
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
    this.setState({gamePlay: !this.state.gamePlay});
    console.log('GAMEPLAY: ', !this.state.gamePlay);
    this.socket.emit('opponentToggleGame', !this.state.gamePlay);
    this.playSound();
  }

  newGame = () => {
    this.setState({
      numBlinks: 0,
      justBlinked: false,
      justSmiled: false,
      gamePlay: false,
      won: null
    });
    this.playSound(this.sounds.intro);
    this.socket.emit('newGame');
  }

  sounds = {
    intro: require('../assets/sounds/Intro.wav'),
    lost: require('../assets/sounds/Lost.wav'),
    won: require('../assets/sounds/Won.wav')
  }

  playSound = async (sound) => {
    const soundObject = new Expo.Audio.Sound();
    Expo.Audio.setIsEnabledAsync(true);
    try {
      await soundObject.loadAsync(sound);
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
    const isSmiling = (rightSmile + leftSmile) > 0.8;

    if (this.state.gamePlay) {
      if ((isBlinking && !this.state.justBlinked) || (isSmiling  && !this.state.justSmiled)) {
        this.playSound();
        if (isBlinking) {
          this.lost(true, false);
          this.setState((state) => {
            return {
              numBlinks: state.numBlinks + 1,
              justBlinked: true,
              won: false
            };
          });
        } else if (isSmiling) {
          this.lost(false, true);
          this.setState({
            justSmiled: true,
            won: false
          });
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

    // const {
    //   [AR.BlendShapes.EyeBlinkR]: leftEyebrow,
    //   [AR.BlendShapes.EyeBlinkL]: rightEyebrow,
    //   [AR.BlendShapes.MouthSmileL]: rightSmile,
    //   [AR.BlendShapes.MouthSmileR]: leftSmile,
    // } = this.state;

    // const message = `You are blinking! You've blinked ${this.state.numBlinks} times.`;

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
          {
            this.state.won === null ? null : (
            this.state.won ? <WinBox /> : <LoseBox />
          )
            }
            <View>
              {
                !this.state.opponentGamePlay ? <Text>Waiting on opponent...</Text> : null
              }
            </View>
        <View style={{flexDirection: 'row'}}>
          <View style={{width: 190, backgroundColor: 'powderblue'}}>
            {
              !this.state.gamePlay ?
              <Button
                disabled={this.state.won !== null}
                title="PLAY"
                onPress={this.toggleGame}
              /> :
              <Button
                disabled={this.state.won !== null}
                title="PAUSE"
                onPress={this.toggleGame}
              />
            }
          </View>
          <View style={{width: 190, backgroundColor: 'powderblue'}}>
            {
              <Button disabled={this.state.gamePlay && this.state.won !== null} title="NEW GAME" onPress={this.newGame} />
            }
          </View>
        </View>
      </View>
    );
  }

  onContextCreate = async event => {
    this.commonSetup(event);
  };

  commonSetup = ({ gl, scale, width, height }) => {
    this.renderer = new ExpoTHREE.renderer({ gl });
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

const WinBox = () => (
    <View style={styles.game}>
      <Text style={styles.win}>YOU WIN</Text>
    </View>
)

const LoseBox = () => (
  <View style={styles.game}>
    <Text style={styles.lose}>YOU LOSE</Text>
  </View>
)


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
  game: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '50%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loseContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  win: {
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 48,
    marginBottom: 16,
  },
  lose: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 48,
    marginBottom: 16,
  },
});
