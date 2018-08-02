import React, {Component} from 'react';
import { FormLabel, FormInput, Button } from 'react-native-elements'

export default class Login extends Component {
  constructor() {
    super();

    this.state = {
      email: '',
      password: ''
    }

  }

  handleChange = (event) => {
    console.log('EVENT: ', event)
    this.setState({
      [event.target.name]: event.target.value
    })
    console.log('THE STATE IS: ', this.state)
  }

  handleSubmit = (event) => {
    console.log('SUBMIT RAN', this.state)
  }

  render() {
    return (
      <React.Fragment>
        <FormLabel>Email</FormLabel>
        <FormInput onChange={this.handleChange} />

        <FormLabel>Password</FormLabel>
        <FormInput onChange={this.handleChange} />

        <Button title="SUBMIT" onPress={this.handleSubmit} />

      </React.Fragment>
    )
  }

}
