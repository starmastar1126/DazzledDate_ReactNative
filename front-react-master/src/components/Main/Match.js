import React, { Component } from "react";
import {
  Footer,
  Button,
  FooterTab,
  Text,
} from "native-base";
import { 
  BackHandler, 
  Image, 
  ScrollView, 
  Platform, 
  Dimensions, 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar 
} from "react-native";

import b_browse from '../../assets/images/browse.png';
import b_incoming from '../../assets/images/incoming.png';
import b_match from '../../assets/images/match.png';
import b_chat from '../../assets/images/chat.png';
import b_age from '../../assets/images/age.png';
import b_myvideo from '../../assets/images/myvideo.png';
import b_name from '../../assets/images/name.png';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class Match extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: [],
      alertMsg: ''
    };
  }

  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'Match';
    this.getHeartUsers();
  }
  getHeartUsers() {
    fetch(`${SERVER_URL}/api/match/matches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          const length = responseJson.data.length;
          if (length === 0) {
            this.setState({
              alertMsg: "There is no match data."
            });
          } else {
            this.getTumbnails(responseJson.data)
          }
        }
      }).catch((error) => {
        return
      });
  }
  getTumbnails = async (data) => {
    var list_items = [];
    for (var i = 0; i < data.length; i++) {
      var url = `${SERVER_URL}/api/storage/videoLink?fileId=${data[i].cdn_id}-screenshot`;
      var vurl = `${SERVER_URL}/api/storage/videoLink?fileId=${data[i].cdn_id}`;
      await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': Global.saveData.token
        }
      }).then((response) => response.json())
        .then((responseJson) => {
          list_items.push({
            index: i, mid: data[i].id,
            otherId: data[i].other_user_id,
            imageUrl: responseJson.url,
            videoUrl: vurl,
            name: data[i].name,
            time: 'TIME',
            age: data[i].age,
            distance: data[i].distance
          });
        }).catch((error) => {
          return
        });
    }
    this.setState({ datas: list_items });
  }
  componentWillMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backPressed);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.backPressed);
  }

  backPressed = () => {
    this.props.navigation.replace("Income");
    return true;
  }

  showUserVideo(url, mid, otherId, name, imgurl, age, distance) {
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        Global.saveData.isMatchVideo = true;
        this.props.navigation.navigate("IncomeDetail", { url: responseJson.url, mid: mid, otherId: otherId, imageUrl: imgurl, name: name, age: age, distance: distance });
      }).catch((error) => {
        alert("There is error, please try again!");
        return
      });
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        <View style={{ marginTop: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Text>{"MATCH"}</Text>
        </View>
        <ScrollView style={{ marginTop: 15 }} removeClippedSubviews={true}>
          {this.state.datas.length === 0 ? (<View style={{
            flex: 1,
            paddingBottom: '50%',
            paddingTop: '50%',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 20, textAlignVertical: 'center' }}> {this.state.alertMsg} </Text>
          </View>) : (
              <FlatList
                numColumns={2}
                style={{ flex: 0 }}
                removeClippedSubviews={true}
                data={this.state.datas}
                initialNumToRender={this.state.datas.length}
                renderItem={({ item: rowData }) => {
                  return (
                    <TouchableOpacity style={{ width: DEVICE_WIDTH / 2 - 10, marginTop: 10, marginLeft: 5, marginRight: 5, }} onPress={() => this.showUserVideo(rowData.videoUrl, rowData.mid, rowData.otherId, rowData.name, rowData.imageUrl, rowData.age, rowData.distance)}>
                      <Image source={{ uri: rowData.imageUrl }} resizeMethod="resize" style={{ width: DEVICE_WIDTH / 2 - 20, height: (DEVICE_WIDTH / 2 - 20), marginTop: 3, marginLeft: 5, backgroundColor: '#5A5A5A' }} />
                      <View style={{ flexDirection: 'row', marginTop: 10, width: (DEVICE_WIDTH / 2 - 10) * 0.6, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}>
                          <Image source={b_name} style={{ width: 10, height: 10, tintColor: '#B64F54' }} />
                          <Text style={{ fontSize: 10, marginLeft: 5, fontWeight: 'bold', color: '#B64F54' }}>{rowData.name}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}>
                          <Image source={b_age} style={{ width: 10, height: 10, tintColor: '#B64F54' }} />
                          <Text style={{ fontSize: 10, marginLeft: 5, fontWeight: 'bold', color: '#B64F54' }}>{"" + rowData.age}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item, index) => index}
              />)}
          <View style={{ height: 50 }} />
        </ScrollView>
        <Footer style={{ backgroundColor: '#222F3F', borderTopColor: '#222F3F', height: Platform.select({ 'android': 50, 'ios': 30 }) }}>
          <FooterTab>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("Browse")}>
              <Image source={b_browse} style={{ width: 25, height: 25, }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"BROWSE"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("Income")}>
              <Image source={b_incoming} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"INCOMING"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => { }}>
              <Image source={b_match} style={{ width: 25, height: 25, tintColor: '#B64F54' }} />
              <Text style={{ color: '#B64F54', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"MATCH"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("Chat")}>
              <Image source={b_chat} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"CHAT"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.replace("MyVideo")}>
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
export default Match;
