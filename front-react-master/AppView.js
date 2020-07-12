import React from 'react';
import Router from './src/Router.js';

export default class AppView extends React.Component {
  constructor(props) {
    super(props);
  } 

  render() {
    return (
      <Router />
    );
  }
}
