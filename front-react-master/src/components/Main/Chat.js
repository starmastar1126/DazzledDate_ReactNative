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
  TextInput,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert
} from "react-native";
import firebase from 'firebase';

import { SERVER_URL } from '../../config/constants';

import b_browse from '../../assets/images/browse.png';
import b_incoming from '../../assets/images/incoming.png';
import b_match from '../../assets/images/match.png';
import b_chat from '../../assets/images/chat.png';
import b_myvideo from '../../assets/images/myvideo.png';
import Global from '../Global';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datas: [],
      tmpData: [],
      searchText: ''
    };
  }

  static navigationOptions = {
    header: null
  };
  
  componentWillMount() {
    Global.saveData.nowPage = 'Chat';
    BackHandler.addEventListener('hardwareBackPress', this.backPressed);
    this.getChatData();
  }
  componentDidMount() {
    firebase.database().ref().child(Global.saveData.u_id)
    .on('child_added', (value) => {
      this.getChatData();
    });
  }
  componentWillUnmount() {   
    BackHandler.removeEventListener('hardwareBackPress', this.backPressed);
  }
  backPressed = () => {
    this.props.navigation.replace("Match");
    return true;
  }
  getChatData() {
    fetch(`${SERVER_URL}/api/chat/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          this.getTumbnails(responseJson.data);
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
            index: i,
            imageUrl: responseJson.url,
            videoUrl: vurl,
            data: data[i]
          });
        })
        .catch((error) => {
          alert(JSON.stringify(error))
          return
        });
    }
    this.setState({
      datas: list_items,
      tmpData: list_items
    });
  }
  toggle() {
    Alert.alert("The UI is not supported yet")
  }
  onPlus() {
    Alert.alert("The UI is not supported yet")
  }
  onSearch(s_text) {
    var tmpData = this.state.tmpData;
    var list_itmes = [];
    for (var i = 0; i < tmpData.length; i++) {
      var name = tmpData[i].data.name;
      var message_text = tmpData[i].data.message_text;
      if (name.toLowerCase().indexOf(s_text.toLowerCase()) !== -1 || message_text.toLowerCase().indexOf(s_text.toLowerCase()) !== -1) {
        list_itmes.push(tmpData[i]);
      }
    }
    this.setState({ datas: list_itmes, searchText: s_text });
  }
  gotoChat(data) {
    Global.saveData.prevpage = "Chat";
    this.props.navigation.navigate("ChatDetail", { data: data })
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        <View style={{ marginTop: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Text>{"CHAT"}</Text>
        </View>
        <View style={styles.inputwrapper}>
          {/* <Icon type="Ionicons" name="ios-search" style={{color:"#808080", marginTop:5}}/> */}
          <TextInput
            style={{ marginLeft: 10, fontSize: 16, width: DEVICE_WIDTH - 40, color: '#000', overflow: 'hidden' }}
            value={this.state.searchText}
            placeholder={"search message"}
            onChangeText={text => this.onSearch(text)}
            placeholderTextColor="#808080"
            underlineColorAndroid="transparent"
          />
        </View>
        <ScrollView style={{ marginTop: 15 }} removeClippedSubviews={true}>
          {(this.state.datas.length != 0) && (
            <FlatList
              numColumns={1}
              style={{ flex: 0 }}
              removeClippedSubviews={true}
              data={this.state.datas}
              initialNumToRender={this.state.datas.length}
              renderItem={({ item: rowData }) => {
                return (
                  <TouchableOpacity style={{ width: DEVICE_WIDTH - 10, flexDirection: 'row', marginTop: 10, marginLeft: 5, marginRight: 5, }} onPress={() => this.gotoChat(rowData)}>
                    <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={{ uri: rowData.imageUrl }} resizeMode="cover" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#5A5A5A' }} />
                    </View>
                    <View style={{ width: DEVICE_WIDTH - 170, height: 40, marginLeft: 5, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ width: DEVICE_WIDTH - 170 }}>
                        <Text numberOfLines={1} style={{ color: '#808080' }}>{rowData.data.name}</Text>
                        <Text numberOfLines={1} style={{ fontSize: 12, color: '#808080' }}>{rowData.data.message_text}</Text>
                      </View>
                    </View>
                    <View style={{ width: 100, height: 40, marginLeft: 5, alignItems: 'center', justifyContent: 'center' }}>
                      <Text numberOfLines={1} style={{ fontSize: 12, color: '#808080' }}>{rowData.data.time_ago}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => index}
            />)}
          <View style={{ height: 50 }} />
        </ScrollView>
        <Footer style={{ height: Platform.select({ 'android': 50, 'ios': 30 }) }}>
          <FooterTab>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.navigate("Browse")}>
              <Image source={b_browse} style={{ width: 25, height: 25, }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"BROWSE"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.navigate("Income")}>
              <Image source={b_incoming} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"INCOMING"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.navigate("Match")}>
              <Image source={b_match} style={{ width: 25, height: 25 }} />
              <Text style={{ color: '#fff', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"MATCH"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent >
              <Image source={b_chat} style={{ width: 25, height: 25, tintColor: '#B64F54' }} />
              <Text style={{ color: '#B64F54', fontSize: 6, fontWeight: 'bold', marginTop: 3 }}>{"CHAT"}</Text>
            </Button>
            <Button style={{ backgroundColor: '#222F3F', borderRadius: 0 }} transparent onPress={() => this.props.navigation.navigate("MyVideo")}>
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
  inputwrapper: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    height: 40,
    marginLeft: 10,
    marginTop: 10,
    paddingLeft: 15,
    width: DEVICE_WIDTH - 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f00',
    fontSize: 18,
    color: '#000',
  },
});
export default Chat;
