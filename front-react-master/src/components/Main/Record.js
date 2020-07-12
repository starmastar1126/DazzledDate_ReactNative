import React, { Component } from "react";
import {
  Text,
  Icon
} from "native-base"
import { Image, Dimensions, View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { RNCamera } from 'react-native-camera';
import Video from 'react-native-video';
import heart from '../../assets/images/heart.png';
import playing from '../../assets/images/playing.png';
import recordImg from '../../assets/images/b_recording.png';
import saving from '../../assets/images/saving.png';
import retrying from '../../assets/images/retrying.png';
import stoping from '../../assets/images/stoping.png';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class Record extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      isRecorded: false,
      recordedUri: '',
      paused: true,
      saving: false,
      recordTime: 0,
      recordTimeText: '00:00',
      uploadCredentials: null,
    };
  }
  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'Record';
    fetch(`${SERVER_URL}/api/storage/uploadCredentials`, {
      method: 'GET',
      headers: {        
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      },
    })
    .then(response => {
      return response.json();
    })
    .then(uploadCredentials => {
      if (uploadCredentials.message === 'Auth Failed') {
        throw new Error(uploadCredentials.message);
      } else {
        this.setState({
          uploadCredentials,
        });
      }
    })
    .catch((error) => {
      console.log(`error`, error);
    });
  }
  onRecord() {
    if (this.state.recording) {
      this.stopRecording()
    }
    else {
      this.setState({ isRecorded: false, recording: true, recordedUri: '', recordTimeText: '00:00' });
      this.startRecording()
    }
  }
  onRetry() {
    this.setState({
      recording: false,
      isRecorded: false,
      recordedUri: '',
      paused: true,
      saving: false,
      recordTime: 0,
      recordTimeText: '',
    })
  }
  async startRecording() {
    // default to mp4 for android as codec is not set
    let timer = setInterval(this.setTime, 1000);
    this.setState({ timer });
    const { uri, codec = "mp4" } = await this.camera.recordAsync();
    this.setState({ isRecorded: true, recording: false, recordedUri: uri, });
  }
  setTime = () => {
    var rtime = this.state.recordTime + 1;
    var min = parseInt(rtime / 60);
    var sec = rtime - 60 * min;
    var rtext = ""
    if (min < 10) {
      rtext = "0" + min + ":"
    }
    else {
      rtext = "" + min + ":"
    }
    if (sec < 10) {
      rtext = "" + rtext + "0" + sec
    }
    else {
      rtext = "" + rtext + sec
    }
    this.setState({ recordTime: rtime, recordTimeText: rtext })
  }
  stopRecording() {
    clearTimeout(this.state.timer);
    this.setState({ recordTime: 0, recordTimeText: '00:00' });
    this.camera.stopRecording();
    // this.setState({isRecorded:true,recording:false,});
  }
  videoError() {

  }
  openPlay() {
    this.setState({ paused: false })
  }
  openStop() {
    this.setState({ paused: true })
  }
  onUpload() {
    console.log(this.state.recordedUri);
    console.log(this.state.uploadCredentials);
    const {
      policy,
      fileId,
    } = this.state.uploadCredentials;
    const file = this.state.recordedUri;

    const formData = new FormData();
    formData.append('GoogleAccessId', 'main-service-account@dazzled-date-246123.iam.gserviceaccount.com');
    formData.append('key', fileId);
    formData.append('bucket', 'fireblast-begonia-maxwell-dev');
    formData.append('Content-Type', 'video/mp4');
    formData.append('policy', policy.base64);
    formData.append('signature', policy.signature);
    // formData.append('file', file);
    formData.append("file", {
      name: "video.mp4",
      type: 'video/mp4',
      uri: this.state.recordedUri,
    });

    fetch('http://fireblast-begonia-maxwell-dev.storage.googleapis.com', {
      method: 'POST',
      // mode: 'no-cors',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        console.log(err);
      });
    // this.props.navigation.navigate("Browse",{url:this.state.recordedUri})
  }
  rgisterVideo() {

  }
  onBack() {
    this.props.navigation.pop()
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar translucent={true} backgroundColor='transparent' barStyle='dark-content' />
        {!this.state.isRecorded && <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={{ height: DEVICE_HEIGHT, width: DEVICE_WIDTH }}
          type={RNCamera.Constants.Type.front}
          flashMode={RNCamera.Constants.FlashMode.on}
          permissionDialogTitle={"Permission to use camera"}
          permissionDialogMessage={
            "We need your permission to use your camera phone"
          }
        />}

        {this.state.isRecorded &&
          <Video source={{ uri: this.state.recordedUri }}   // Can be a URL or a local file.
            ref={(ref) => {
              this.player = ref
            }}
            paused={this.state.paused}
            repeat={true}
            onEnd={() => this.openStop()}
            onError={this.videoError}               // Callback when video cannot be loaded
            style={{ height: DEVICE_HEIGHT, width: DEVICE_WIDTH }} />
        }
        <TouchableOpacity style={{ position: 'absolute', left: 0, top: 30, width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => this.onBack()}
        >
          <Icon type="Ionicons" name="ios-arrow-back" style={{ color: '#B64F54' }} />
        </TouchableOpacity>
        {!this.state.isRecorded && (
          <View style={{ position: 'absolute', top: DEVICE_HEIGHT * 0.2, width: DEVICE_WIDTH, height: DEVICE_WIDTH * 0.7, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={heart} style={{ width: DEVICE_WIDTH * 0.7, height: DEVICE_WIDTH * 0.7, opacity: 0.75 }} />
          </View>)}
        {this.state.recording && (
          <View style={{
            position: 'absolute', left: 0, bottom: 100, height: 40, width: DEVICE_WIDTH,
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Text style={{ fontSize: 18, color: '#DE5859' }}>{this.state.recordTimeText}</Text>
          </View>)}
        <View
          style={{
            position: 'absolute', left: 0, bottom: 30, height: 40, width: DEVICE_WIDTH, flexDirection: 'row',
            alignItems: 'center', justifyContent: 'center'
          }}>
          <View style={{ width: DEVICE_WIDTH * 0.8, height: 60, flexDirection: 'row', justifyContent: this.state.isRecorded ? 'space-between' : 'center' }}>
            {this.state.isRecorded && this.state.paused && (
              <TouchableOpacity onPress={() => this.openPlay()}>
                <Image source={playing} style={{ width: 60, height: 60 }} />
              </TouchableOpacity>)}
            {this.state.isRecorded && !this.state.paused && (
              <TouchableOpacity onPress={() => this.openStop()}>
                <Image source={stoping} style={{ width: 60, height: 60 }} />
              </TouchableOpacity>)}
            {!this.state.isRecorded && (
              <TouchableOpacity
                onPress={() => this.onRecord()}
              //  activeOpacity={1.0} 
              //  delayPressIn={0}
              //  onPressIn={()=>this.onRecord()}
              //  onPressOut={()=>this.onRecord()}
              >
                <Image source={recordImg} style={{ width: 60, height: 60 }} />
              </TouchableOpacity>)}
            {this.state.isRecorded && (
              <TouchableOpacity onPress={() => this.onRetry()}>
                <Image source={retrying} style={{ width: 60, height: 60 }} />
              </TouchableOpacity>)}
            {this.state.isRecorded && (
              <TouchableOpacity onPress={() => this.onUpload()}>
                <Image source={saving} style={{ width: 60, height: 60 }} />
              </TouchableOpacity>)}
          </View>
        </View>
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
export default Record;
