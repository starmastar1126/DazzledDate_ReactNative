import React, { Component } from "react";
import {
  Footer,
  Button,
  FooterTab,
  Icon,
  Text,
} from "native-base";
import {
  ImageBackground,
  BackHandler,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert
} from "react-native";

import b_browse from '../../assets/images/browse.png';
import b_incoming from '../../assets/images/incoming.png';
import b_match from '../../assets/images/match.png';
import b_chat from '../../assets/images/chat.png';
import b_myvideo from '../../assets/images/myvideo.png';
import b_delete from '../../assets/images/delete.png';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class MyVideo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: []
    };
  }

  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'MyVideo';
    this.props.navigation.addListener('didFocus', (playload) => {
      this.getVideos()
    });
  }
  getVideos() {
    fetch(`${SERVER_URL}/api/video/getMyAllVideo`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    })
      .then(response => response.json())
      .then(responseJson => {
        if (!responseJson.error) {
          console.log('Videos:', responseJson.data);
          this.getThumbnails(responseJson.data);
        }
      })
      .catch((error) => {
        console.log('getVideos() Error', error);
      });
  }
  getThumbnails(videos) {
    const list_items = [];
    Promise.all(
      videos.map((video, idx) => {
        return fetch(
          `${SERVER_URL}/api/storage/videoLink?fileId=${video.cdn_id}-screenshot`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': Global.saveData.token
            }
          }
        )
          .then(response => {
            return response.json()
              .catch(e => {
                console.log(`.json() error:`, e);
                return null;
              });
          })
          .then(signedUrl => {
            if (signedUrl && signedUrl.url) {
              return {
                index: idx,
                id: video.id,
                otherId: video.user_id,
                primary: video.is_primary,
                imageUrl: signedUrl.url,
                videoUrl: `${SERVER_URL}/api/storage/videoLink?fileId=${video.cdn_id}`,
                name: 'NAME',
                time: 'TIME'
              }
            } else {
              return null;
            }
          });
      })
    )
      .then(assets => assets.filter(Boolean))
      .then(assets => {
        this.setState({ datas: assets });
      });
  }
  componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backPressed);
  }
  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backPressed);
  }
  backPressed = () => {
    this.props.navigation.replace("Chat");
    return true;
  }
  showUserVideo(url, otherId, id, primary) {
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        this.props.navigation.navigate("MyVideoDetail", { url: responseJson.url, otherId: otherId, id: id, primary })
      }).catch((error) => {
        alert("There is error, please try again!");
        return
      });
  }
  addVideo() {
    this.props.navigation.navigate("Record")
  }
  onDeleteVideo(otherid) {
    Alert.alert(
      '',
      'Are you sure you want to delete this video?',
      [
        { text: 'Delete', backgroundColor: '#FCDD80', onPress: () => this.deleteVideo(otherid) },
        { text: 'Cancel', backgroundColor: '#FCDD80', onPress: () => () => console.log('Cancel Pressed'), style: 'cancel' },
      ],
      { cancelable: false });
  }
  deleteVideo(otherid) {
    fetch(`${SERVER_URL}/api/video/removeMyVideo/${otherid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          this.getVideos()
        }
      })
      .catch((error) => {
        return
      });
  }
  gotoProfileSetting() {
    this.props.navigation.navigate("ProfileSetting");
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        <View style={{ marginTop: 40, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: DEVICE_WIDTH - 80, marginLeft: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text>{"MY VIDEOS"}</Text>
          </View>
          <TouchableOpacity style={{ width: 30, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
            onPress={() => this.gotoProfileSetting()}>
            <Icon type="MaterialCommunityIcons" name="menu" style={{ color: "#000", marginTop: 5 }} />
          </TouchableOpacity>
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
                  <TouchableOpacity style={{ width: DEVICE_WIDTH / 2 - 10, marginTop: 10, marginLeft: 5, marginRight: 5, }}
                    onPress={() => this.showUserVideo(rowData.videoUrl, rowData.otherId, rowData.id, rowData.primary)}>
                    <ImageBackground source={{ uri: rowData.imageUrl }} resizeMethod="resize" style={{ width: DEVICE_WIDTH / 2 - 20, height: (DEVICE_WIDTH / 2 - 20) * 1.5, marginTop: 3, marginLeft: 5, backgroundColor: '#5A5A5A' }}>
                      <View style={{ width: '100%', height: 30, marginTop: (DEVICE_WIDTH / 2 - 20) * 1.5 - 50, flexDirection: 'row' }}>
                        <View style={{ width: DEVICE_WIDTH / 2 - 60, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                          {(rowData.primary == 1) && (
                            <View style={{ width: DEVICE_WIDTH, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 40 }}>
                              <TouchableOpacity style={{ width: 80, height: 30, borderRadius: 25, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 14, color: '#fff', fontWeight: 'bold' }}>{"Primary"}</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => this.onDeleteVideo(rowData.id)}>
                          <Image source={b_delete} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => index}
            />)}
          <View style={{ height: 50 }} />
        </ScrollView>
        <TouchableOpacity style={{
          position: 'absolute', right: 15,
          bottom: Platform.select({ 'android': 90, 'ios': 105 }),
          width: 70, height: 70,
          backgroundColor: '#f00', borderRadius: 35,
          alignItems: 'center', justifyContent: 'center'
        }}
          onPress={() => this.addVideo()}>
          <Icon type="FontAwesome" name="plus" style={{ color: '#fff' }} />
        </TouchableOpacity>
        <Footer style={{ height: Platform.select({ 'android': 50, 'ios': 30 }) }}>
          <FooterTab>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("Browse")}>
              <Image source={b_browse} style={{ width: 25, height: 25, }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"BROWSE"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("Income")}>
              <Image source={b_incoming} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"INCOMING"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("Match")}>
              <Image source={b_match} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"MATCH"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.navigate("Chat")}>
              <Image source={b_chat} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"CHAT"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => { }}>
              <Image source={b_myvideo} style={{ width: 25, height: 25, tintColor: '#B64F54' }} />
              <Text style={{ color: '#B64F54', fontSize: 8, fontWeight: 'bold', marginTop: 3 }}>{"MY VIDEO"}</Text>
            </Button>
          </FooterTab>
        </Footer>
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
export default MyVideo;
