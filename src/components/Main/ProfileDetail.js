import React, { Component } from "react";
import {
  Icon,
  Content,
} from "native-base";
import { Dimensions, View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import Video from 'react-native-video';
import Global from '../Global';

class ProfileDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      paused: false,
      vUrl: '',
      username: '',
      userage: '',
      userdistance: '',
      otherId: -1,
    };
  }

  static navigationOptions = {
    header: null
  };
  
  componentWillMount() {
    Global.saveData.nowPage = 'ProfileDetail';
    this.setState({
      vUrl: this.props.navigation.state.params.url,
      otherId: this.props.navigation.state.params.otherId
    });
  }

  componentDidMount() {
    this.props.navigation.addListener('didFocus', (playload) => {
      this.setState({ paused: false })
    });
  }

  onReject() {
    this.props.navigation.pop();
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        <Content>
          {(this.state.vUrl != "") && (
            <Video source={{ uri: this.state.vUrl }}   // Can be a URL or a local file.
              ref={(ref) => {
                this.player = ref
              }}
              ignoreSilentSwitch={null}
              resizeMode="cover"
              repeat={true}
              paused={this.state.paused}
              onError={this.videoError}           // Callback when video cannot be loaded
              style={{ height: DEVICE_HEIGHT, width: DEVICE_WIDTH }} 
            />
          )}
        </Content>
        <TouchableOpacity style={{ position: 'absolute', left: 0, top: 30, width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => this.onReject()}>
          <Icon type="Ionicons" name="ios-arrow-back" style={{ color: '#B64F54' }} />
        </TouchableOpacity>
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
export default ProfileDetail;
