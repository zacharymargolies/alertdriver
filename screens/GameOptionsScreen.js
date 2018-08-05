import React, { Component } from 'react';
import {Button} from 'react-native'

export default class GameOptions extends Component {
  constructor() {
    super();

    initialState = {
      difficulty: 1
    }
  }

  setDifficulty = (level) => {
    this.setState({difficulty: level})
  }

  render() {
    return (
      <React.Fragment>
        <Button title="EASY" onPress={() => {this.setDifficulty(1)}} />

        <Button title="MEDIUM" onPress={() => {this.setDifficulty(2)}} />

        <Button title="HARD" onPress={() => {this.setDifficulty(3)}} />
      </React.Fragment>
    )
  }
}
