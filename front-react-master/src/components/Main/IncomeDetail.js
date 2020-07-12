import React, { Component } from "react";
import {
  Icon,
  Text,
  Content,
} from "native-base";
import {
  BackHandler,
  Image,
  Dimensions,
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar
} from "react-native";

import Video from 'react-native-video';
import b_notification from '../../assets/images/notification.png';

import b_name from '../../assets/images/name.png';
import b_age from '../../assets/images/age.png';
import b_distance from '../../assets/images/distance.png';
import b_profile from '../../assets/images/profile.png';

import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class IncomeDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      paused: false,
      vUrl: '',
      username: '',
      userage: '',
      userimage: '',
      matchId: -1,
      userdistance: '',
      otherId: -1,
      isMatchVideo: false,
      privatedPaused: false
    };
  }

  static navigationOptions = {
    header: null
  };

  componentWillMount() {
    Global.saveData.nowPage = 'IncomeDetail';
    BackHandler.addEventListener('hardwareBackPress', this.back);
    if (Global.saveData.prePage == "Profile") {
      Global.saveData.prePage = "";
      this.setState({
        vUrl: Global.saveData.prevUrl,
        otherId: Global.saveData.preOtherId,
        isMatchVideo: Global.saveData.isMatchVideo,
        username: Global.saveData.prename,
        userage: Global.saveData.preage,
        userimage: Global.saveData.preimage,
        matchId: Global.saveData.prematchID,
        userdistance: Global.saveData.preuserdistance
      });
    } else {
      Global.saveData.prevUrl = this.props.navigation.state.params.url;
      Global.saveData.preOtherId = this.props.navigation.state.params.otherId;
      Global.saveData.prename = this.props.navigation.state.params.name;
      Global.saveData.preage = this.props.navigation.state.params.age;
      Global.saveData.preimage = this.props.navigation.state.params.imageUrl;
      Global.saveData.prematchID = this.props.navigation.state.params.mid;
      Global.saveData.preuserdistance = parseInt(this.props.navigation.state.params.distance);

      this.setState({
        vUrl: this.props.navigation.state.params.url,
        otherId: this.props.navigation.state.params.otherId,
        isMatchVideo: Global.saveData.isMatchVideo,
        username: this.props.navigation.state.params.name,
        userage: this.props.navigation.state.params.age,
        userimage: this.props.navigation.state.params.imageUrl,
        matchId: this.props.navigation.state.params.mid,
        userdistance: parseInt(this.props.navigation.state.params.distance)
      });
    }
  }
  componentDidMount() {
    this.props.navigation.addListener('didFocus', (playload) => {
      this.setState({ paused: false, privatedPaused: false });
    });
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.back);
  }
  gotoChat() {
    if (this.state.matchId == -1) {
      return;
    }
    this.setState({ paused: true, privatedPaused: true });
    alert(JSON.stringify(this.state.userimage));
    var otherData = {
      imageUrl: this.state.userimage,
      data: {
        name: this.state.username,
        other_user_id: this.state.otherId,
        match_id: this.state.matchId
      }
    }
    Global.saveData.prevpage = "IncomeDetail"
    this.props.navigation.navigate("ChatDetail", { data: otherData })
  }
  onReject() {
    var details = {
      'otherId': this.state.otherId
    };
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(`${SERVER_URL}/api/match/sendHeartReject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          this.setState({
            paused: true
          });
          this.props.navigation.replace("Income");
        }
      })
      .catch((error) => {
        return
      });
  }
  onMatch() {
    this.setState({
      paused: true
    });
    var details = {
      'otherId': this.state.otherId
    };
    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    fetch(`${SERVER_URL}/api/match/requestMatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': Global.saveData.token
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          this.getMatchedVideo(responseJson.data.cdn_id, responseJson.data.match_id);
        }
      }).catch((error) => {
        return
      });
  }
  getMatchedVideo = (cdnId, matchId) => {
    fetch(`${SERVER_URL}/api/storage/videoLink?fileId=${cdnId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.url) {
          fetch("http://138.197.203.178:8080/api/storage/videoLink?fileId=" + cdnId + "-thumbnail", {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': Global.saveData.token
            }
          }).then((t_response) => t_response.json())
            .then((t_responseJson) => {
              if (t_responseJson.url) {
                Global.saveData.prevUrl = responseJson.url;
                this.setState({
                  vUrl: responseJson.url,
                  userimage: t_responseJson.url,
                  matchId: matchId,
                  isMatchVideo: true,
                  privatedPaused: false
                });
              }
            }).catch((error) => {
              alert("There is error, please try again!");
              return
            });
        }
      }).catch((error) => {
        alert("There is error, please try again!");
        return
      });
  }
  gotoProfile() {
    this.setState({ paused: true });
    if (this.state.otherId != -1) {
      Global.saveData.prevpage = "IncomeDetail";
      Global.saveData.isMatchVideo = this.state.isMatchVideo;
      this.props.navigation.replace("Profile", { id: this.state.otherId, name: this.state.username });
    }
  }
  back = () => {
    if (this.state.isMatchVideo === true) {
      this.props.navigation.replace("Match");
    } else {
      this.props.navigation.replace("Income");
    }
  }
  gotoReport() {
    if (this.state.otherId != -1) {
      this.props.navigation.navigate("Report", { id: this.state.otherId })
    }
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        <Content>
          {!this.state.isMatchVideo && (
            <Video source={{ uri: this.state.vUrl }}   // Can be a URL or a local file.
              ref={(ref) => {
                this.player = ref
              }}
              ignoreSilentSwitch={null}
              resizeMode="cover"
              repeat={true}
              paused={this.state.paused}
              onError={this.videoError}              // Callback when video cannot be loaded
              style={{ height: DEVICE_HEIGHT, width: DEVICE_WIDTH }}
            />
          )}
          {this.state.isMatchVideo && (
            <Video source={{ uri: this.state.vUrl }}   // Can be a URL or a local file.
              ref={(ref) => {
                this.cdnPlayer = ref
              }}
              ignoreSilentSwitch={null}
              resizeMode="cover"
              repeat={true}
              paused={this.state.privatedPaused}
              onError={this.videoError}              // Callback when video cannot be loaded
              style={{ height: DEVICE_HEIGHT, width: DEVICE_WIDTH }}
            />
          )}
        </Content>
        <View style={{ position: 'absolute', left: 0, top: 50, }}>
          <TouchableOpacity style={{ width: 60, height: 60, marginBottom: 20, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => this.back()}>
            <Icon type="Ionicons" name="ios-arrow-back" style={{ color: '#B64F54' }} />
          </TouchableOpacity>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={{ width: 60, height: 50, borderWidth: 1.5, borderRadius: 7, borderColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.gotoReport()}>
              <Image source={b_notification} style={{ width: 30, height: 30 }} />
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 60, height: 50, borderWidth: 1.5, borderRadius: 7, borderColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.gotoProfile()}>
              <Image source={b_profile} style={{ width: 30, height: 30 }} />
            </TouchableOpacity>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
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
          </View>
        </View>
        {!this.state.isMatchVideo && (
          <View style={{ position: 'absolute', left: 0, bottom: 120 }}>
            <View style={{ width: DEVICE_WIDTH * 0.5, marginLeft: DEVICE_WIDTH * 0.25, flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => this.onReject()}>
                <Icon type="FontAwesome" name="close" style={{ color: '#B64F54' }} />
              </TouchableOpacity>
              <TouchableOpacity style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#B64F54', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => this.onMatch()}>
                <Icon type="FontAwesome" name="heart" style={{ color: '#fff' }} />
              </TouchableOpacity>
            </View>
          </View>)}
        {this.state.isMatchVideo && (
          <View style={{ position: 'absolute', left: 0, bottom: 120 }}>
            <TouchableOpacity
              style={{
                width: DEVICE_WIDTH * 0.5,
                height: 40,
                marginLeft: DEVICE_WIDTH * 0.25,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#B64F54',
                borderRadius: DEVICE_WIDTH * 0.25
              }}
              onPress={() => this.gotoChat()}>
              <Text style={{ color: '#fff', fontSize: 16 }}>{"Start Chat!"}</Text>
            </TouchableOpacity>
          </View>
        )
        }
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
export default IncomeDetail;
