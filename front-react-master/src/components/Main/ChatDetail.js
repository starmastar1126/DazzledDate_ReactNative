import React from 'react'
import {
  Icon,
  Text,
} from "native-base";
import {
  GiftedChat,
  Send,
  InputToolbar,
  Composer,
  Bubble,
  GiftedAvatar,
  utils
} from "react-native-gifted-chat";
import {
  Image,
  Platform,
  Dimensions,
  View,
  StyleSheet,
  TouchableOpacity
} from "react-native";

import Global from '../Global';
import b_location from '../../assets/images/location.png';
import b_picture from '../../assets/images/picture.png';
import b_camera from '../../assets/images/camera.png';
import b_userplus from '../../assets/images/userplus.png';

import {SERVER_URL} from '../../config/constants';

class ChatDetail extends React.Component {
  state = {
    isExtraSending: false,
    messages: [],
    my_imgurl: '',
    my_id: 0,
    other_imgurl: '',
    other_id: -1,
    match_id: -1,
    other_name: '',
    openMenu: false,
  }

  componentDidMount() {
    Global.saveData.nowPage = 'ChatDetail';
    var userdata = this.props.navigation.state.params.data;
    this.setState({
      my_imgurl: 'https://pickaface.net/gallery/avatar/Opi51c74d0125fd4.png',
      other_imgurl: userdata.data.imageUrl,
      my_id: 0,
      my_name: 'pys',
      other_name: userdata.data.name,
      other_id: userdata.data.other_user_id,
      match_id: userdata.data.match_id
    }, function(){
      this.loadMessages();
    });    
  }
  loadMessages = async () => {
    var userdata = this.props.navigation.state.params.data;
    var match_id = userdata.data.match_id;
    var other_imgurl = userdata.data.imageUrl;
    var my_id = 0;
    var other_id = userdata.data.other_user_id;
    var match_id = userdata.data.match_id;

    await fetch(`${SERVER_URL}/api/chat/getChatWithMatchId/${match_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        //   alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var user_data = responseJson.data.user
          var m_data = responseJson.data.content
          m_data.sort(function (a, b) {
            return b.id - a.id;
          });
          var message_list = [];
          for (var i = 0; i < m_data.length; i++) {
            message_list.push({
              _id: (m_data[i].message_type == 1) ? my_id : other_id,
              text: m_data[i].message_text,
              createdAt: new Date(m_data[i].created_date),
              user: {
                _id: (m_data[i].message_type == 1) ? my_id : other_id,
                name: user_data.name,
                avatar: (m_data[i].message_type == 1) ? null : other_imgurl,
              },
            });
          }
          this.setState({ messages: message_list });
        }
      }).catch((error) => {
        return
      });
    this.loadMessages();
  }
  static navigationOptions = {
    header: null
  };
  handlePress(avatar) {

  }
  renderBubble = (props) => {
    //right avatar
    const renderAvatarOnTop = props.renderAvatarOnTop;
    const messageToCompare = renderAvatarOnTop ? props.previousMessage : props.nextMessage;
    if (props.user._id === props.currentMessage.user._id) {
      return (
        <View style={{ flexDirection: 'row' }}>
          <Bubble
            {...props}
            onLongPress={() => { }}
            textStyle={{
              right: {
                color: '#000'
              }
            }}
            wrapperStyle={{
              left: {
                backgroundColor: '#000'
              },
              right: {
                backgroundColor: '#fff',
                borderWidth: 0.5,
                borderColor: '#aaa'
              }
            }}
            containerStyle={{ backgroundColor: '#000' }}
          />
          {utils.isSameUser(props.currentMessage, messageToCompare) && utils.isSameDay(props.currentMessage, messageToCompare) ?
            <GiftedAvatar avatarStyle={{ alignSelf: 'flex-end', marginLeft: 5 }} /> :
            <GiftedAvatar
              {...props}
              user={props.currentMessage.user}
              avatarStyle={{ alignSelf: 'flex-end', marginTop: 5, marginLeft: 5 }}
              onPress={() => this.handlePress('avatar')} />
          }
        </View>
      );
    }

    //default bubble
    return (
      <View style={styles.bubbleView}>
        <Bubble
          {...props}
          onLongPress={() => { }}
          textStyle={{
            left: {
              color: '#fff',
            },
            right: {
              color: '#fff'
            }
          }}
          wrapperStyle={{
            left: {
              backgroundColor: '#EC595A',
            },
            right: {
              backgroundColor: '#000'
            }
          }}
        />
      </View>
    );
  };
  sendMessage(message) {
    for (let i = 0; i < message.length; i++) {
      var details = {
        'matchId': this.state.match_id,
        'messageText': message[i].text
      };
      var formBody = [];
      for (var property in details) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
      formBody = formBody.join("&");
      fetch(`${SERVER_URL}/api/chat/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': Global.saveData.token
        },
        body: formBody,
      }).then((response) => response.json())
        .then((responseJson) => {
          //alert(JSON.stringify(responseJson))
        })
        .catch((error) => {
          alert(JSON.stringify(error))
          return
        });
    }
  }
  renderInputToolbar(props) {
    return (
      <InputToolbar {...props} containerStyle={{ backgroundColor: '#fff', }} />
    );
  }
  renderSend = props => {
    return (
      <Send {...props}>
        <View style={{ width: 30, height: 30, borderRadius: 15, marginRight: 10, marginLeft: 5, marginBottom: 5, backgroundColor: '#EC595A', alignItems: 'center', justifyContent: 'center' }}>
          <Icon type="Ionicons" name="ios-send" style={{ color: '#fff' }} />
        </View>
      </Send>
    );
    //containerStyle
  }
  onExtraSending() {
    this.setState({ isExtraSending: !this.state.isExtraSending })
  }
  gotoProfile() {
    if (this.state.other_id != -1) {
      Global.saveData.prevpage = "ChatDetail";
      this.props.navigation.navigate("Profile", { id: this.state.other_id, name: this.state.other_name });
    }
  }
  rendercomposer = props => {
    return (
      <View>
        {this.state.isExtraSending && (
          <TouchableOpacity style={{
            marginLeft: 10, width: 30, height: 120, backgroundColor: '#EC595A', marginTop: -120, borderTopStartRadius: 15, borderTopEndRadius: 15,
            justifyContent: 'center', alignItems: 'center'
          }}>
            <TouchableOpacity>
              <Image source={b_location} style={{ width: 25, height: 25, marginTop: 5 }} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image source={b_picture} style={{ width: 25, height: 25, marginTop: 5 }} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image source={b_camera} style={{ width: 25, height: 25, marginTop: 5 }} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image source={b_userplus} style={{ width: 25, height: 25, marginTop: 5 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', width: DEVICE_WIDTH - 40, alignItems: 'center', justifyContent: 'center' }}>
          <Composer {...props} textInputStyle={{ backgroundColor: '#fff', opacity: 1.0, marginTop: 5, fontSize: 16, paddingTop: Platform.select({ ios: 10, android: 5, }) }} />
        </View>
      </View>
    );
  }
  back() {
    if (Global.saveData.prevpage === 'Chat'){
      this.props.navigation.replace("Chat");
    } else {
      this.props.navigation.pop();
    }
  }
  setToggle() {
    this.setState({ openMenu: !this.state.openMenu });
  }
  gotoReport() {
    if (this.state.other_id != -1) {
      this.props.navigation.navigate("Report", { id: this.state.other_id })
    }
  }
  onBlock() {
    Alert.alert(
      'Are you sure you want to block this user?',
      'Once blocked, all chat history will disappear from the chat list',
      [
        { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
        { text: 'Cinfirm', onPress: () => this.setBlock() },
      ],
      { cancelable: false });
  }
  setBlock() {
    var details = {
      'otherId': this.state.other_id
    };

    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    fetch(`${SERVER_URL}/api/chat/blockChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        if (!responseJson.error) {
          this.back();
        }
        else {
          Alert.alert(responseJson.message);
        }
      }).catch((error) => {
        alert(JSON.stringify(error));
        return
      });
  }
  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ width: DEVICE_WIDTH, height: 60, flexDirection: 'row', marginTop: Platform.select({ 'android': 10, 'ios': 40, }), alignItems: 'center' }}>
          <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 60, zIndex: 1000, marginLeft: 10 }}
            onPress={() => this.back()}>
            <Icon type="Ionicons" name="ios-arrow-back" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', justifyContent: 'center', width: DEVICE_WIDTH - 100, flexDirection: 'row' }}>
            <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 24, marginLeft: 5, marginTop: 5 }}>{this.state.other_name}</Text>
          </View>
          <TouchableOpacity style={{ width: 40, marginLeft: 10, }} onPress={() => this.setToggle()}>
            <Icon type="MaterialCommunityIcons" name="dots-horizontal" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <GiftedChat
            style={{ height: DEVICE_HEIGHT - 100 }}
            messages={this.state.messages}
            onSend={messages => this.sendMessage(messages)}
            //renderBubble={this.renderBubble}
            renderComposer={this.rendercomposer}
            renderInputToolbar={this.renderInputToolbar}
            onPressAvatar={() => this.gotoProfile()}
            alwaysShowSend={true}
            renderSend={this.renderSend}
            keyboardShouldPersistTaps="never"
            user={{
              _id: this.state.my_id,
              name: this.state.my_name,
              avatar: this.state.my_imgurl,
            }}
          />
        </View>
        {(this.state.openMenu) && (
          <View style={{ position: 'absolute', left: DEVICE_WIDTH - 90, top: 90, width: 80, height: 70, borderWidth: 1, borderColor: '#000' }}>
            <TouchableOpacity style={{ width: 80, height: 30, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => this.gotoReport()}
            >
              <Text>{"Report"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ width: 80, height: 30, alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
              onPress={() => this.onBlock()}
            >
              <Text>{"Block"}</Text>
            </TouchableOpacity>
          </View>)}
      </View>
    )
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
    borderColor: '#EC595A',
    fontSize: 18,
    color: '#000',
  },
});
export default ChatDetail;