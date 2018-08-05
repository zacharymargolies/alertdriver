import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import GameScreen from '../screens/GameScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// import LoginScreen from '../screens/LoginScreen';
import GameOptionsScreen from '../screens/GameOptionsScreen';

// const LoginStack = createStackNavigator({
//   Login: LoginScreen,
// });

// LoginStack.navigationOptions = {
//   tabBarLabel: 'Login',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon
//       focused={focused}
//       name={
//         Platform.OS === 'ios'
//           ? `ios-information-circle${focused ? '' : '-outline'}`
//           : 'md-information-circle'
//       }
//     />
//   ),
// };

const GameOptionsStack = createStackNavigator({
  GameOptions: GameOptionsScreen,
});

GameOptionsStack.navigationOptions = {
  tabBarLabel: 'Game Options',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? `ios-options${focused ? '' : '-outline'}` : 'md-options'}
    />
  ),
};

const GameStack = createStackNavigator({
  Game: GameScreen,
});

GameStack.navigationOptions = {
  tabBarLabel: 'Game',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? `ios-game-controller-b${focused ? '' : '-outline'}` : 'md-link'}
    />
  ),
};

// const ProfileStack = createStackNavigator({
//   Profile: ProfileScreen,
// });

// ProfileStack.navigationOptions = {
//   tabBarLabel: 'Profile',
//   tabBarIcon: ({ focused }) => (
//     <TabBarIcon
//       focused={focused}
//       name={Platform.OS === 'ios' ? `ios-person${focused ? '' : '-outline'}` : 'md-options'}
//     />
//   ),
// };

export default createBottomTabNavigator({
  // LoginStack,
  GameOptionsStack,
  GameStack,
  // ProfileStack
});
