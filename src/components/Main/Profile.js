import React, { Component } from "react";
import {
  Icon,
  Text,
} from "native-base";
import { 
  ImageBackground, 
  ScrollView,
  Platform, 
  Dimensions, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar 
} from "react-native";

import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      name: '',
      datas: []
    };
  }

  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'Profile';
    var otherid = this.props.navigation.state.params.id;
    var othername = this.props.navigation.state.params.name;

    this.setState({ id: otherid, name: othername });
    this.getVideos(otherid);
  }
  getVideos(otherid) {
    fetch(`${SERVER_URL}/api/video/othervideo/${otherid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          this.getTumbnails(responseJson.data)
        }
      })
      .catch((error) => {
        return
      });
  }
  getTumbnails = async (data) => {

    var list_items = [];
    for (var i = 0; i < data.length; i++) {
      var value = Object.values(data[i]);
      var url = `${SERVER_URL}/api/storage/videoLink?fileId=${value[0]}-screenshot`;
      var vurl = `${SERVER_URL}/api/storage/videoLink?fileId=${value[0]}`;
      await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': Global.saveData.token
        }
      }).then((response) => response.json())
        .then((responseJson) => {
          list_items.push({
            index: i,
            otherId: data[i].other_user_id,
            imageUrl: responseJson.url,
            videoUrl: vurl,
            name: 'NAME',
            time: 'TIME'
          });
        }).catch((error) => {
          return
        });
    }
    this.setState({
      datas: list_items
    });
  }
  showUserVideo(url, otherId) {
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        this.props.navigation.navigate("ProfileDetail", { url: responseJson.url, otherId: otherId })
      })
      .catch((error) => {
        alert("There is error, please try again!");
        return
      });
  }
  onBack() {
    if (Global.saveData.prevpage == "ChatDetail") {
      this.props.navigation.pop();
    }
    else {
      Global.saveData.prePage = "Profile"
      this.props.navigation.replace(Global.saveData.prevpage);
    }
  }

  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        <View style={{ height: 40, marginTop: Platform.select({ 'ios': '10%', 'android': '10%' }), flexDirection: 'row' }}>
          <TouchableOpacity style={{ width: 40, height: 40, marginLeft: 10, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => this.onBack()} >
            <Icon type="Ionicons" name="ios-arrow-back" style={{ color: '#B64F54' }} />
          </TouchableOpacity>
          <View style={{ width: DEVICE_WIDTH - 100, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>{this.state.name}</Text>
          </View>
        </View>
        <ScrollView style={{ marginTop: 15 }} removeClippedSubviews={true}>
          {(this.state.datas.length != 0) && (
            <FlatList
              numColumns={2}
              style={{ flex: 0 }}
              removeClippedSubviews={true}
              data={this.state.datas}
              initialNumToRender={this.state.datas.length}
              renderItem={({ item: rowData }) => {
                return (
                  <TouchableOpacity style={{ width: DEVICE_WIDTH / 2 - 10, marginTop: 10, marginLeft: 5, marginRight: 5, }} onPress={() => this.showUserVideo(rowData.videoUrl, rowData.otherId)}>
                    <ImageBackground source={{ uri: rowData.imageUrl }} resizeMethod="resize" style={{ width: DEVICE_WIDTH / 2 - 20, height: (DEVICE_WIDTH / 2 - 20) * 1.5, marginTop: 3, marginLeft: 5, backgroundColor: '#5A5A5A' }}>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => index}
            />)}
          <View style={{ height: 50 }} />
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
export default Profile;
