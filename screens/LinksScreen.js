import { AR } from 'expo';
import ExpoTHREE, { THREE } from 'expo-three';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import GraphicsView from '../components/GraphicsView';
import * as ThreeAR from '../ThreeAR';

let messages = [
  'Close your eyes to start...',
  'Why you scowling?',
  'Oh nevermind...',
  "Whoa, seriously what's up?!",
  'lol bored yet 😂',
  "Whatever, guess I'll join you }:|",
];
class LinksScreen extends React.Component {
  state = {
    scowlCount: 0,
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
              blendShapes: [AR.BlendShapes.EyeBlinkR, AR.BlendShapes.EyeBlinkL],
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

  handleFace = (anchor, eventType) => {
    const { blendShapes } = anchor;

    const {
      [AR.BlendShapes.EyeBlinkR]: leftEyebrow,
      [AR.BlendShapes.EyeBlinkL]: rightEyebrow,
    } = blendShapes;

    let { scowlCount, isScowling: wasScowling } = this.state;
    const isScowling = leftEyebrow > 0.6 && rightEyebrow > 0.6;
    if (isScowling !== wasScowling) {
      scowlCount = (scowlCount + 1) % messages.length;
      if (scowlCount % 2 === 1 && !isScowling) {
        scowlCount -= 1;
      }
    }

    this.setState({ ...blendShapes, scowlCount, isScowling });
  };

  componentWillUnmount() {
    AR.removeAllListeners(AR.EventTypes.AnchorsDidUpdate);
  }

  render() {
    const config = AR.TrackingConfigurations.Face;

    const {
      [AR.BlendShapes.EyeBlinkR]: leftEyebrow,
      [AR.BlendShapes.EyeBlinkL]: rightEyebrow,
      scowlCount,
    } = this.state;

    const message = messages[scowlCount % messages.length];

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
        <View style={styles.infoContainer}>
          <InfoBox title="Left Eye">{leftEyebrow}</InfoBox>
          <InfoBox title="Right Eye">{rightEyebrow}</InfoBox>
        </View>
        {message && <Text style={styles.coolMessage}>{message}</Text>}
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

class InfoBox extends React.PureComponent {
  render() {
    const { title, children } = this.props;
    let value = (children || 0).toFixed(2);
    return (
      <View style={styles.infoBoxContainer}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoSubtitle}>{value}</Text>
      </View>
    );
  }
}

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
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  infoSubtitle: {
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

export default LinksScreen;
