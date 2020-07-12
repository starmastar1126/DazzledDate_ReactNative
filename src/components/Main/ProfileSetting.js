import React, { Component } from "react";
import {
  Text,
  Icon,
} from "native-base"
import { Dimensions, TextInput, ScrollView, View, StyleSheet, TouchableOpacity, StatusBar, Alert } from "react-native";
import { Dropdown } from 'react-native-material-dropdown';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class ProfileSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      languageData: [],
      language: '',
      cityData: [],
      city: '',
      country: '',
      countryData: [],
    };
  }

  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'ProfileSetting';
    this.setState({ name: Global.saveData.u_name })
    this.get_ethnicity()
    this.get_country()
    this.get_language()
  }
  componentWillMount() {

  }
  get_ethnicity() {
    fetch(`${SERVER_URL}/api/ethnicity/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        //alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var data = responseJson.data;
          var itmes = [];
          for (var i = 0; i < data.length; i++) {
            itmes.push({ value: data[i].ethnicity_name })
          }
          this.setState({ city: Global.saveData.u_city, cityData: itmes })
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }
  get_country() {
    fetch(`${SERVER_URL}/api/country/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        // alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var data = responseJson.data;
          var itmes = [];
          for (var i = 0; i < data.length; i++) {
            itmes.push({ value: data[i].country_name })
          }
          this.setState({ country: Global.saveData.u_country, countryData: itmes })
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }

  get_language() {
    fetch(`${SERVER_URL}/api/language/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        //  alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var data = responseJson.data;
          var itmes = [];
          for (var i = 0; i < data.length; i++) {
            itmes.push({ value: data[i].language_name })
          }
          this.setState({ language: Global.saveData.u_language, languageData: itmes })
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }


  onBack() {
    this.props.navigation.pop()
  }
  gotoTermofService() {
    this.props.navigation.navigate("TermsPolicy")
  }
  onUpdate() {
    if (this.state.name == '') {
      Alert.alert("The name field is not inputed")
      return
    }
    var lanD = this.state.languageData
    var lanindex = 1;
    for (var i = 0; i < lanD.length; i++) {
      if (lanD[i].value == this.state.language) {
        lanindex = i + 1
        break;
      }
    }

    var cityD = this.state.cityData
    var cityindex = 1;
    for (var i = 0; i < cityD.length; i++) {
      if (cityD[i].value == this.state.city) {
        cityindex = i + 1
        break;
      }
    }

    var countryD = this.state.countryData
    var coutryindex = 1;
    for (var i = 0; i < countryD.length; i++) {
      if (countryD[i].value == this.state.country) {
        coutryindex = i + 1
        break;
      }
    }
    var details = {
      'name': this.state.name,
      'languageId': lanindex,
      'ethnicityId': cityindex,
      'countryId': coutryindex
    };

    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(`${SERVER_URL}/api/user/updateSetting`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          Global.saveData.u_name = this.state.name
          Global.saveData.u_city = this.state.city
          Global.saveData.u_country = this.state.country
          Global.saveData.u_language = this.state.language
          Alert.alert(responseJson.message)
        }
        else {
          Alert.alert(responseJson.message)
        }
      })
      .catch((error) => {
        return
      });
  }
  onCloseAccout() {
    Alert.alert(
      '',
      'Are you sure you want to close your account?Once it is closed, you cannot login to this account  again',
      [
        { text: 'Confirm', backgroundColor: '#FCDD80', onPress: () => this.closeAccout() },
        { text: 'Cancel', backgroundColor: '#FCDD80', onPress: () => () => console.log('Cancel Pressed'), style: 'cancel' },
      ],
      { cancelable: false });
  }
  closeAccout() {
    this.clearGlobal()
    fetch(`${SERVER_URL}/api/user/removeAccount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          //Alert.alert(responseJson.message)
          this.props.navigation.navigate("FirstScreen")
        }
        else {
          Alert.alert(responseJson.message)
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }
  onLogout() {
    Alert.alert(
      '',
      'Are you sure you want to log out?',
      [
        { text: 'Logout', backgroundColor: '#FCDD80', onPress: () => this.logout() },
        { text: 'Cancel', backgroundColor: '#FCDD80', onPress: () => () => console.log('Cancel Pressed'), style: 'cancel' },
      ],
      { cancelable: false });
  }
  // logout() {
  //   this.clearGlobal()
  //   fetch(`${SERVER_URL}/api/user/logout`, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //       'Authorization': Global.saveData.token
  //     }
  //   }).then((response) => response.json())
  //     .then((responseJson) => {
  //       if (!responseJson.error) {
  //         Global.saveData.token = null;
  //         this.props.navigation.navigate("FirstScreen")
  //       }
  //       else {
  //         Alert.alert(responseJson.message)
  //       }
  //     })
  //     .catch((error) => {
  //       alert(JSON.stringify(error))
  //       return
  //     });
  // }
  logout = () => {
    this.clearGlobal();
    this.props.navigation.navigate("FirstScreen");
  }
  clearGlobal = () => {
    Global.saveData.u_id = '';
    Global.saveData.u_name = '';
    Global.saveData.u_age = '';
    Global.saveData.u_gender = '';
    Global.saveData.u_email = '';
    Global.saveData.u_language = '';
    Global.saveData.u_city = '';
    Global.saveData.u_country = '';
    Global.saveData.u_ins_id = '';
    Global.saveData.u_ins_comp = '';
    Global.saveData.u_phone = '';
    Global.saveData.u_type = '';
    Global.saveData.u_completedNum = 0;
    Global.saveData.u_pendingNum = 0;
    Global.saveData.u_totalNum = 0;
    Global.saveData.token = null;
    Global.saveData.gusetPost = false;
    Global.saveData.newUser = true;
    Global.saveData.isFilter = false;
    Global.saveData.removedFilter = false;
    Global.saveData.filterData = null;
    Global.saveData.isMatchVideo = false;
    Global.saveData.prevpage = "";
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar backgroundColor='#fff' barStyle='dark-content' />
        <View style={{ marginTop: 40, flexDirection: 'row', height: 40 }}>
          <TouchableOpacity style={{ height: 40, width: 40, marginLeft: 10, alignItems: 'center', }}
            onPress={() => this.onBack()}>
            <Icon type="Ionicons" name="ios-arrow-back" />
          </TouchableOpacity>
          <View style={{ width: DEVICE_WIDTH - 80, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: 'bold' }}>{"ACCOUNT SETTING"}</Text>
          </View>
        </View>
        <ScrollView>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 50 }}>
            <TextInput
              style={{ backgroundColor: 'transparent', width: DEVICE_WIDTH * 0.8, height: 40, paddingLeft: 2, color: '#000' }}
              selectionColor="#009788"
              value={this.state.name}
              placeholder="Name"
              placeholderTextColor="#808080"
              onChangeText={name => this.setState({ name })}
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
            <View style={{ height: 1, width: DEVICE_WIDTH * 0.8, backgroundColor: '#808080' }} />
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"LANGUAGE"}</Text>
            </View>
            <View>
              <Dropdown
                containerStyle={{ width: "100%", marginTop: -15 }}
                label=' '
                pickerStyle={{ marginTop: -50, }}
                style={{ color: '#808080', fontSize: 10 }}
                inputContainerStyle={{ borderBottomColor: '#808080', }}
                baseColor="#DE5859"//indicator color
                textColor="#000"
                data={this.state.languageData}
                onChangeText={(language) => this.setState({ language })}
                value={this.state.language}
                dropdownPosition={-4}
              />
            </View>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"ETHNICITY"}</Text>
            </View>
            <View>
              <Dropdown
                containerStyle={{ width: "100%", marginTop: -15 }}
                label=' '
                style={{ color: '#808080', fontSize: 10 }}
                inputContainerStyle={{ borderBottomColor: '#808080', }}
                baseColor="#DE5859"//indicator color
                textColor="#000"
                data={this.state.cityData}
                onChangeText={(city) => this.setState({ city })}
                value={this.state.city}
                dropdownPosition={-4}
              />
            </View>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"COUNTRY"}</Text>
            </View>
            <View>
              <Dropdown
                containerStyle={{ width: "100%", marginTop: -15 }}
                label=' '
                pickerStyle={{ marginTop: -50, }}
                style={{ color: '#808080', fontSize: 10 }}
                inputContainerStyle={{ borderBottomColor: '#808080', }}
                baseColor="#DE5859"//indicator color
                textColor="#000"
                data={this.state.countryData}
                onChangeText={(country) => this.setState({ country })}
                value={this.state.country}
                dropdownPosition={-4}
              />
            </View>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View />
            <TouchableOpacity style={{ width: 180, height: 30, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center', borderRadius: 5 }}
              onPress={() => this.onUpdate()}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{"Update"}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 30, }}
            onPress={() => this.gotoTermofService()}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{"Term and Conditions / Privacy Policy"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 15, }}
            onPress={() => this.onCloseAccout()}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{"Close My Account"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 15, }}
            onPress={() => this.onLogout()}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{"Log Out"}</Text>
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
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
  instructions: {
    textAlign: 'center',
    color: '#3333ff',
    marginBottom: 5,
  },
});
export default ProfileSetting;
