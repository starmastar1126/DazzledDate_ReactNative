import React, { Component } from "react";
import {
  Text, Content,
} from "native-base"
import { 
  Image, 
  ImageBackground, 
  Platform, 
  Dimensions, 
  TextInput, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Alert 
} from "react-native";
import nativeFirebase from 'react-native-firebase';
import store from 'react-native-simple-store';
import logo from '../../assets/images/logo.png';
import slogo from '../../assets/images/second_bg.png';
import emailIcon from '../../assets/images/emailIcon.png';
import passswordIcon from '../../assets/images/passwordIcon.png';
import checkIcon from '../../assets/images/check.png';
import uncheckIcon from '../../assets/images/uncheck.png';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      remberCheck: false,
    };
  }

  static navigationOptions = {
    header: null
  };
  checkRemember() {
    this.setState({ remberCheck: !this.state.remberCheck })
  }
  onLogin() {
    this.props.navigation.replace("Browse");
    if (this.state.email == '') {
      Alert.alert("The email is not inputed")
      return;
    }
    if (this.state.password == '') {
      Alert.alert("The password is not inputed")
      return;
    }
    if (this.state.remberCheck) {
      store.save("email", this.state.email);
      store.save("password", this.state.password);
    }
    nativeFirebase.messaging().getToken().then(fcmToken => {
      if (fcmToken) {
        var details = {
          'useremail': this.state.email,
          'userpassword': this.state.password,
          'deviceId': fcmToken
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
        }).then((response) => response.json())
          .then((responseJson) => {
            if (!responseJson.error) {
              Global.saveData.token = responseJson.data.token;
              Global.saveData.u_id = responseJson.data.id
              Global.saveData.u_name = responseJson.data.name
              Global.saveData.u_age = responseJson.data.age
              Global.saveData.u_gender = responseJson.data.gender
              Global.saveData.u_email = responseJson.data.email
              Global.saveData.u_language = responseJson.data.language
              Global.saveData.u_city = responseJson.data.ethnicity
              Global.saveData.u_country = responseJson.data.country
              Global.saveData.newUser = false;
              this.props.navigation.replace("Browse");
            } else {
              Alert.alert("The email or password is invalid,\n please try again");
            }
          }).catch((error) => {
            return
          });
      }
    });

  }
  gotoSignup() {
    this.props.navigation.navigate("Signup");
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar backgroundColor='#fff' barStyle='dark-content' />
        <ImageBackground
          source={slogo}
          style={{
            width: DEVICE_WIDTH,
            height: 150,
            marginTop: Platform.select({ 'android': 0, 'ios': 30 }),
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Image source={logo} style={{ width: 205, height: 83, tintColor: '#DE5859' }} />
        </ImageBackground>
        <Content>
          <View style={{ width: DEVICE_WIDTH, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
            <Text style={{ color: '#000', fontSize: 24, fontWeight: 'bold' }}>{"Login to Continue"}</Text>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={emailIcon} style={{ width: 15, height: 15, tintColor: '#808080' }} />
              <Text style={{ color: '#808080', fontSize: 12, marginLeft: 10 }}>{"EMAIL ID"}</Text>
            </View>
            <View>
              <TextInput
                style={{
                  backgroundColor: 'transparent',
                  width: DEVICE_WIDTH * 0.8,
                  height: 40,
                  paddingLeft: 10,
                  color: '#000'
                }}
                selectionColor="#009788"
                keyboardType="email-address"
                textContentType="emailAddress"
                onChangeText={email => this.setState({ email })}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={{ height: 1, width: DEVICE_WIDTH * 0.8, backgroundColor: '#808080' }} />
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={passswordIcon} style={{ width: 15, height: 15, tintColor: '#808080' }} />
              <Text style={{ color: '#808080', fontSize: 12, marginLeft: 10 }}>{"PASSWORD"}</Text>
            </View>
            <View>
              <TextInput
                style={{ backgroundColor: 'transparent', width: DEVICE_WIDTH * 0.8, height: 40, paddingLeft: 10, color: '#000' }}
                secureTextEntry
                selectionColor="#009788"
                onChangeText={password => this.setState({ password })}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={{ height: 1, width: DEVICE_WIDTH * 0.8, backgroundColor: '#808080' }} />
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} onPress={() => this.checkRemember()}>
              {this.state.remberCheck && <Image source={checkIcon} style={{ width: 15, height: 15 }} />}
              {!this.state.remberCheck && <Image source={uncheckIcon} style={{ width: 15, height: 15 }} />}
              <Text style={{ color: '#000', marginLeft: 10, fontSize: 12, fontWeight: 'bold' }}>{"Remember me"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center' }} onPress={() => this.gotoForgetPassword()}>
              <Text style={{ color: '#000', fontSize: 12, fontWeight: 'bold' }}>{"Forget password"}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: DEVICE_WIDTH, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <TouchableOpacity style={{ width: DEVICE_WIDTH * 0.8, height: 40, borderRadius: 25, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.onLogin()}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{"LOGIN"}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: DEVICE_WIDTH, justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
            <Text style={{ color: '#000', fontSize: 14, }}>{"- or -"}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
            <Text style={{ color: '#000', fontSize: 14, }}>{"Don't have an account yet?"}</Text>
            <TouchableOpacity onPress={() => this.gotoSignup()}>
              <Text style={{ color: '#DE5859', fontSize: 14, textDecorationLine: 'underline', fontWeight: 'bold' }}>{" Sign Up "}</Text>
            </TouchableOpacity>
          </View>
        </Content>
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
    backgroundColor: '#fff',
  },
});
export default Login;
