import React, { Component } from "react";
import {
  Footer,
  Button,
  FooterTab,
  Icon,
  Text,
  Content,
} from "native-base";
import { 
  AsyncStorage,
  BackHandler, 
  Image, 
  Platform, 
  Dimensions, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Alert
} from "react-native";
import Video from 'react-native-video';
import b_browse from '../../assets/images/browse.png';
import b_incoming from '../../assets/images/incoming.png';
import b_match from '../../assets/images/match.png';
import b_chat from '../../assets/images/chat.png';
import b_myvideo from '../../assets/images/myvideo.png';
import b_notification from '../../assets/images/notification.png';
import b_filters from '../../assets/images/filters.png';
import b_name from '../../assets/images/name.png';
import b_age from '../../assets/images/age.png';
import b_distance from '../../assets/images/distance.png';
import b_profile from '../../assets/images/profile.png';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class Browse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      otherid: -1,
      vid: '',
      paused: false,
      vUrl: '',
      username: '',
      userage: '',
      userdistance: '',
      userData: null,
      isnoUser: false,
    };
  }

  static navigationOptions = {
    header: null
  };

  componentWillMount() {
    Global.saveData.nowPage = 'Browse';
    BackHandler.addEventListener('hardwareBackPress', this.backPressed);
    this.retrieveData();
  }

  componentDidMount() {
    this.props.navigation.addListener('didFocus', (playload) => {
      if (Global.saveData.isFilter) {
        this.getFilterVideos();
      }
      else {
        this.getVideos();
      }
    });
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backPressed);
  }  
  
  getVideos() {
    fetch(`${SERVER_URL}/api/match/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          if (responseJson.data) {
            this.setState({ isnoUser: false })
            this.getDetails(responseJson.data)
          }
          else {
            this.setState({ isnoUser: true })
          }
        }
      })
      .catch((error) => {
        return
      });
  }
  getFilterVideos() {
    var details = {
      'distance': Global.saveData.filterData.Distance,
      'lessAge': Global.saveData.filterData.toAge,
      'greaterAge': Global.saveData.filterData.fromAge,
      'gender': Global.saveData.filterData.Gender
    };
    if (Global.saveData.filterData.lang != 0) {
      details['languageId'] = Global.saveData.filterData.lang
    }
    if (Global.saveData.filterData.City != 0) {
      details['ethnicityId'] = Global.saveData.filterData.City
    }
    if (Global.saveData.filterData.Country != 0) {
      details['countryId'] = Global.saveData.filterData.Country
    }

    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(`${SERVER_URL}/api/match/discover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          if (responseJson.data) {
            this.setState({ isnoUser: false });
            this.getDetails(responseJson.data);
          }
          else {
            this.setState({
              paused: true,
              otherid: -1,
              isnoUser: true,
              vid: -1,
              vUrl: '',
              username: '',
              userage: '',
              userdistance: ''
            });
          }
        }
      }).catch((error) => {
        return
      }
    );
  }
  getDetails = async (data) => {
    var v_url = `${SERVER_URL}/api/storage/videoLink?fileId=${data.cdn_filtered_id}`;

    fetch(v_url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        this.setState({
          paused: false,
          otherid: data.id,
          vid: data.id,
          vUrl: responseJson.url,
          username: data.name,
          userage: this.getAge(data.birth_date),
          userdistance: parseInt(data.distance)
        });
      })
      .catch((error) => {
        alert("There is error, please try again!")
        return
      }
    );
  }
  getAge(birth) {
    var b_year = parseInt(birth.split("-")[0]);
    var c_year = parseInt(new Date().getFullYear());
    return c_year - b_year;
  }
  onReject() {
    var details = {
      'otherId': this.state.vid
    };
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(`${SERVER_URL}/api/match/dislike`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          if (Global.saveData.isFilter) {
            this.getFilterVideos();
          } else {
            this.getVideos();
          }
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }
  onHeart() {
    var details = {
      'otherId': this.state.vid
    };
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(`${SERVER_URL}/api/match/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          if (Global.saveData.isFilter) {
            this.getFilterVideos()
          }
          else {
            this.getVideos()
          }
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      }
    );
  }
  
  backPressed = () => {          
    Alert.alert(
      '',
      'Do you want to exit the app?',
      [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'Yes', onPress: () => this.exitApp()},
      ],
      { cancelable: false });
    return true;
  }
  exitApp = () => {
    this.saveGlobals().then(() => {
      BackHandler.exitApp();
    });
  }
  saveGlobals = async () => {
    try {
      await AsyncStorage.setItem('globalData', Global.saveData);
    } catch (error) {
      // Error saving data
      console.log(error);
    }
  }
  retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('globalData');      // We have data!!
      if (value !== null) {
        alert(JSON.stringify(value));  
      }
    } catch (error) {
      // Error retrieving data
      alert(error);
    }
  };
  gotoFilter() {
    this.setState({
      paused: true
    });
    this.props.navigation.replace("Filter")
  }
  gotoIncome() {
    this.setState({ paused: true })
    this.props.navigation.replace("Income")
  }
  gotoMatch() {
    this.setState({ paused: true })
    this.props.navigation.replace("Match")
  }
  gotoChat() {
    this.setState({ paused: true })
    this.props.navigation.replace("Chat")
  }
  gotoMyVideo() {
    this.setState({ paused: true })
    this.props.navigation.replace("MyVideo")
  }
  gotoProfile = () => {
    this.setState({ paused: true });

    if (this.state.otherid && this.state.otherid !== -1) {
      Global.saveData.prevpage = "Browse";
      this.props.navigation.replace("Profile", { id: this.state.otherid, name: this.state.username });
    }
  }
  gotoReport() {
    if (this.state.otherid !== -1) {
      this.props.navigation.navigate("Report", { id: this.state.otherid })
    }
  }
  videoError = () => {
    alert('Video Loading Error!');
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        {this.state.isnoUser ?
          (<Content>
            <View>
              <View style={{ alignSelf: 'flex-end', marginTop: '10%', marginRight: '5%', position: 'absolute', }}>
                <TouchableOpacity style={{ width: 60, height: 50, borderWidth: 1.5, borderRadius: 7, borderColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => this.gotoFilter()}>
                  <Image source={b_filters} style={{ width: 30, height: 30 }} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: '50%', paddingBottom: '50%' }}>
                <Text style={{ fontSize: 20, }}>{"Sorry, there are no more users!"}</Text>
              </View>
            </View>
          </Content>) : (
            <Content>
              {(this.state.vUrl != "") && (
                <Video source={{ uri: this.state.vUrl }}   // Can be a URL or a local file.
                  ref={(ref) => {
                    this.player = ref
                  }}
                  resizeMode="cover"
                  ignoreSilentSwitch={null}
                  repeat={true}
                  paused={false}
                  onError={this.videoError}               // Callback when video cannot be loaded
                  style={{ height: DEVICE_HEIGHT, width: DEVICE_WIDTH }}
                />
              )}
              <View style={{ position: 'absolute', left: 0, top: 70, }}>
                <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, flexDirection: 'row', justifyContent: 'space-between' }}>
                  {(this.state.vUrl != "") && (<TouchableOpacity style={{ width: 60, height: 50, borderWidth: 1.5, borderRadius: 7, borderColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => this.gotoReport()}>
                    <Image source={b_notification} style={{ width: 30, height: 30 }} />
                  </TouchableOpacity>)}
                  <TouchableOpacity style={{ width: 60, height: 50, borderWidth: 1.5, borderRadius: 7, borderColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => this.gotoFilter()}>
                    <Image source={b_filters} style={{ width: 30, height: 30 }} />
                  </TouchableOpacity>
                </View>
                {(this.state.vUrl != "") && (<View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <View style={{ flexDirection: 'row' }}>
                      <Image source={b_name} style={{ width: 15, height: 15 }} />
                      <Text style={{ marginLeft: 10, color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{this.state.username}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 5 }}>
                      <Image source={b_age} style={{ width: 15, height: 15 }} />
                      <Text style={{ marginLeft: 10, color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{this.state.userage}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 5 }}>
                      <Image source={b_distance} style={{ width: 15, height: 15 }} />
                      <Text style={{ marginLeft: 10, color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{this.state.userdistance}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={{ width: 60, height: 50, borderWidth: 1.5, borderRadius: 7, borderColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
                    onPress={this.gotoProfile}>
                    <Image source={b_profile} style={{ width: 30, height: 30 }} />
                  </TouchableOpacity>
                </View>)}
              </View>
              {(this.state.vUrl != "") && (<View style={{ position: 'absolute', left: 0, bottom: 120 }}>
                <View style={{ width: DEVICE_WIDTH * 0.5, marginLeft: DEVICE_WIDTH * 0.25, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => this.onReject()}>
                    <Icon type="FontAwesome" name="close" style={{ color: '#B64F54' }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => this.onHeart()}>
                    <Icon type="FontAwesome" name="heart" style={{ color: '#fff' }} />
                  </TouchableOpacity>
                </View>
              </View>)}
            </Content>
          )
        }
        <Footer style={{ borderTopColor: '#222F3F', height: Platform.select({ 'android': 50, 'ios': 30 }) }}>
          <FooterTab style={{ backgroundColor: '#222F3F' }}>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent >
              <Image source={b_browse} style={{ width: 25, height: 25, tintColor: '#B64F54' }} />
              <Text style={{ color: '#B64F54', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"BROWSE"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.gotoIncome()}>
              <Image source={b_incoming} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"INCOMING"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.gotoMatch()}>
              <Image source={b_match} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"MATCH"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.gotoChat()}>
              <Image source={b_chat} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"CHAT"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.gotoMyVideo()}>
              <Image source={b_myvideo} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"MY VIDEO"}</Text>
            </Button>
          </FooterTab>
        </Footer>
      </View>
    );
  }
}
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
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
export default Browse;
