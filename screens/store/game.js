import { createStore, applyMiddleware } from "../../node_modules/redux";
import {createLogger} from 'redux-logger';

// ACTION TYPES
const UPDATE_GAME_DIFFICULTY = 'UPDATE_GAME_DIFFICULTY';

// ACTION CREATORS
export const updateGameDifficulty = (difficulty) => ({
  type: UPDATE_GAME_DIFFICULTY,
  gameDifficulty: difficulty
});

// INITIAL STATE
const initialState = {
  gameDifficulty: 3
};

const reducer = function(state = initialState, action) {
  switch (action.type) {
    case UPDATE_GAME_DIFFICULTY:
      console.log("UPDATE GAME DIFFICULTY CALLED");
      return ({gameDifficulty: action.gameDifficulty});
    default:
      return state;
  }
};

const middleware =
  applyMiddleware(createLogger({collapsed: true}));

const store = createStore(reducer, middleware);

export default store;
