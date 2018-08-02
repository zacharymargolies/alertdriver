import React from 'react';
import { Platform, StatusBar, StyleSheet, View, Text, Button } from 'react-native';
import { AppLoading, Asset, Font, Icon } from 'expo';
import AppNavigator from './navigation/AppNavigator';
window.navigator.userAgent = 'react-native';
import io from 'socket.io-client';

export default class App extends React.Component {
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

    this.socket.on('update', () => {
      this.setState({message: 'Socket message received'});
    });

  }

  sendMessage = () => {
    console.log('SEND MESSAGE CLICKED');
    this.socket.emit('sendMessage');
  }

  state = {
    isLoadingComplete: false,
    message: 'No socket message sent...'
  };

  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    } else {
      return (
        <View style={styles.container}>
          {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
          <AppNavigator />
        </View>
      // <View>
      //   <Text>
      //     SOCKET TEST
      //   </Text>
      //   <Text>
      //     SOCKET MESSAGE:
      //   </Text>
      //   <Text>
      //     {this.state.message}
      //   </Text>
      //   <Button
      //     onPress={this.sendMessage}
      //     title="Send Message to Computer" />>
      // </View>
      );
    }
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/robot-dev.png'),
        require('./assets/images/robot-prod.png'),
      ]),
      Font.loadAsync({
        // This is the font that we are using for our tab bar
        ...Icon.Ionicons.font,
        // We include SpaceMono because we use it in HomeScreen.js. Feel free
        // to remove this if you are not using it in your app
        'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      }),
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
