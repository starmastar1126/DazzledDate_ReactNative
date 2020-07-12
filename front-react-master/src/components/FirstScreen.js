import React, { Component } from "react";
import {
  Text,
} from "native-base"
import { 
  ImageBackground, 
  Dimensions, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar 
} from "react-native";
import store from 'react-native-simple-store';
// import logo from '../assets/images/logo.png';
import firstBg from '../assets/images/first_bg.jpg';
import Global from './Global';

import {SERVER_URL} from '../config/constants';

class FirstScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
    };
  }
  static navigationOptions = {
    header: null
  };

  componentWillMount() {    
    store.get('email').then((email) => {
      if (email) {
        store.get('password').then((password) => {
          if (password) {
            //login
            this.props.navigation.navigate("Main");
          }
        });
      }
    });
  }
  
  onLogin(email, password) {
    var details = {
      'useremail': email,
      'userpassword': password
    };

    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    fetch(`${SERVER_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody,
    })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        if (!responseJson.error) {
          Global.saveData.token = responseJson.data.token;
          Global.saveData.u_id = responseJson.data.id;
          Global.saveData.u_name = responseJson.data.name;
          Global.saveData.u_age = responseJson.data.age;
          Global.saveData.u_gender = responseJson.data.gender;
          Global.saveData.u_email = responseJson.data.email;
          Global.saveData.u_language = responseJson.data.language;
          Global.saveData.u_city = responseJson.data.ethnicity;
          Global.saveData.u_country = responseJson.data.country;
          Global.saveData.newUser = false;
          this.props.navigation.replace("Main");
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }
  gotoLogin() {
    this.props.navigation.replace("Login");
  }
  gotoSignUp() {
    this.props.navigation.navigate("Signup");
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <ImageBackground source={firstBg} style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <StatusBar backgroundColor='#ED6164' barStyle='dark-content' />
          <View style={{ position: 'absolute', width: DEVICE_WIDTH, height: 40, bottom: 60, left: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 150, height: 40, borderWidth: 1, borderRadius: 20, borderColor: '#fff' }}
              onPress={() => this.gotoLogin()}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{"Login"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 150, height: 40, borderWidth: 1, borderRadius: 20, borderColor: '#fff', marginLeft: 5 }}
              onPress={() => this.gotoSignUp()}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{"REGISTER"}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>
    );
  }
}
const DEVICE_WIDTH = Dimensions.get('window').width;
// const DEVICE_HEIGHT = Dimensions.get('window').height;
const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ED6164',
    alignItems: 'center',
    justifyContent: 'center'
  },
});
export default FirstScreen;
