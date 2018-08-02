import React from 'react';
import { Text } from 'react-native';

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'User Profile'
  };


  render() {
    return (
    <React.Fragment>
      <Text>PROFILE SCREEN</Text>
    </React.Fragment>
    );
  }
}
