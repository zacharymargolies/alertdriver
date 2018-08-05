/* eslint-disable react/display-name*/
import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import GameScreen from '../screens/GameScreen';
import GameOptionsScreen from '../screens/GameOptionsScreen';

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

export default createBottomTabNavigator({
  GameOptionsStack,
  GameStack
});
