import React from 'react';
import {connect} from 'react-redux'
import {Button} from 'react-native-elements'
import { updateGameDifficulty } from './store/game';
import { View, StyleSheet } from 'react-native'

const GameOptions = (props) => (
      <View style={styles.container}>
        <Button
        borderRadius={50}
        raised
        backgroundColor="#2ecc71"
        title="EASY"
        onPress={() => {props.updateGameDifficulty(3)}} />

        <Button
        borderRadius={50}
        raised
        backgroundColor="#e67e22"
        title="MEDIUM"
        onPress={() => {props.updateGameDifficulty(2)}} />

        <Button
        borderRadius={50}
        raised
        backgroundColor="#c0392b"
        title="HARD" onPress={() => {props.updateGameDifficulty(1)}} />
      </View>
);

const mapDispatchToProps = (dispatch) => ({
  updateGameDifficulty: (difficulty) => {
    dispatch(updateGameDifficulty(difficulty));
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 50,
    backgroundColor: '#f1d953',
    flexDirection: 'column',
    justifyContent: 'center'
  }
})

export default connect(null, mapDispatchToProps)(GameOptions);
