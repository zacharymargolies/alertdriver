import React, { Component } from 'react';
import {connect} from 'react-redux'
import {Button} from 'react-native'
import { updateGameDifficulty } from './store/game';

class GameOptions extends Component {
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
        <Button title="EASY" onPress={() => {this.props.updateGameDifficulty(1)}} />

        <Button title="MEDIUM" onPress={() => {this.props.updateGameDifficulty(2)}} />

        <Button title="HARD" onPress={() => {this.props.updateGameDifficulty(3)}} />
      </React.Fragment>
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  updateGameDifficulty: (difficulty) => {
    dispatch(updateGameDifficulty(difficulty));
  }
})


export default connect(null, mapDispatchToProps)(GameOptions);
