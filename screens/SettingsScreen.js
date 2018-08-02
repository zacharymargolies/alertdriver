import React from 'react';
import { ExpoConfigView } from '@expo/samples';
import Expo from 'expo';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'app.json',
  };


  render() {
    let soundObject = new Expo.Audio.Sound();
    Expo.Audio.setIsEnabledAsync(true)
    async function playSound() {
    try {
      await soundObject.loadAsync(require('../assets/beep.mp3'));
      await soundObject.playAsync();
    } catch (err) {
      console.log(err);
    }
  }
  playSound();
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */
    return (
    <React.Fragment>
      <ExpoConfigView />
    </React.Fragment>
    );
  }
}
