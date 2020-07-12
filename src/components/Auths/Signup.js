import React, { Component } from "react";
import {
  Text,
  Content
} from "native-base"
import { 
  ImageBackground, 
  Image, 
  Platform, 
  Dimensions, 
  TextInput, 
  View, StyleSheet, 
  TouchableOpacity, StatusBar, Alert } from "react-native";
import logo from '../../assets/images/logo.png';
import slogo from '../../assets/images/second_bg.png';
import emailIcon from '../../assets/images/emailIcon.png';
import passswordIcon from '../../assets/images/passwordIcon.png';
import userIcon from '../../assets/images/userIcon.png';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: '',
      password: '',
      cpassword: '',
    };
  }

  static navigationOptions = {
    header: null
  };
  handleSignup() {
    if (this.state.name == '') {
      Alert.alert("The name is not inputed")
      return;
    }
    if (this.state.email == '') {
      Alert.alert("The email is not inputed")
      return;
    }
    if (this.state.password == '') {
      Alert.alert("The password is not inputed")
      return;
    }
    if (this.state.password != this.state.cpassword) {
      Alert.alert("The confirm password is not correct")
      return;
    }
    this.props.navigation.navigate("Register1", { name: this.state.name, email: this.state.email, password: this.state.password })
  }
  gotoLogin() {
    this.props.navigation.navigate("Login")
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar backgroundColor='#fff' barStyle='dark-content' />
        <ImageBackground source={slogo} style={{ width: DEVICE_WIDTH, height: 150, marginTop: Platform.select({ 'android': 0, 'ios': 30 }), alignItems: 'center', justifyContent: 'center' }}>
          <Image source={logo} style={{ width: 205, height: 83, tintColor: '#DE5859' }} />
        </ImageBackground>
        <Content>
          <View style={{ width: DEVICE_WIDTH, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
            <Text style={{ color: '#000', fontSize: 24, fontWeight: 'bold' }}>{"Create Account"}</Text>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={userIcon} style={{ width: 15, height: 15, tintColor: '#808080' }} />
              <Text style={{ color: '#808080', fontSize: 12, marginLeft: 10 }}>{"NAME"}</Text>
            </View>
            <View>
              <TextInput
                style={{ backgroundColor: 'transparent', width: DEVICE_WIDTH * 0.8, height: 40, paddingLeft: 10, color: '#000' }}
                selectionColor="#009788"
                onChangeText={name => this.setState({ name })}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={{ height: 1, width: DEVICE_WIDTH * 0.8, backgroundColor: '#808080' }} />
          </View>

          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={emailIcon} style={{ width: 15, height: 15, tintColor: '#808080' }} />
              <Text style={{ color: '#808080', fontSize: 12, marginLeft: 10 }}>{"EMAIL ID"}</Text>
            </View>
            <View>
              <TextInput
                style={{ backgroundColor: 'transparent', width: DEVICE_WIDTH * 0.8, height: 40, paddingLeft: 10, color: '#000' }}
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
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={passswordIcon} style={{ width: 15, height: 15, tintColor: '#808080' }} />
              <Text style={{ color: '#808080', fontSize: 12, marginLeft: 10 }}>{"CONFIRM PASSWORD"}</Text>
            </View>
            <View>
              <TextInput
                style={{ backgroundColor: 'transparent', width: DEVICE_WIDTH * 0.8, height: 40, paddingLeft: 10, color: '#000' }}
                secureTextEntry
                selectionColor="#009788"
                onChangeText={cpassword => this.setState({ cpassword })}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>
            <View style={{ height: 1, width: DEVICE_WIDTH * 0.8, backgroundColor: '#808080' }} />
          </View>
          <View style={{ width: DEVICE_WIDTH, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <TouchableOpacity style={{ width: DEVICE_WIDTH * 0.8, height: 40, borderRadius: 25, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.handleSignup()}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{"SIGN UP"}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
            <Text style={{ color: '#000', fontSize: 14, }}>{"Already have an account?"}</Text>
            <TouchableOpacity onPress={() => this.gotoLogin()}>
              <Text style={{ color: '#DE5859', fontSize: 14, textDecorationLine: 'underline', fontWeight: 'bold' }}>{" Sign In "}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 10 }} />
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
export default Signup;
