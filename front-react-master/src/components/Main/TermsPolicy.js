import React, { Component } from 'react';
import {
  Icon,
  Text
} from "native-base";
import {
  View,
  StyleSheet,
  StatusBar,
  WebView,
  Platform,
  Dimensions, TouchableOpacity
} from 'react-native';
import Global from '../Global';

var BGWASH = 'rgba(255,255,255,0.8)';
var DISABLED_WASH = 'rgba(255,255,255,0.25)';

var TEXT_INPUT_REF = 'urlInput';
var WEBVIEW_REF = 'webview';

class TermsPolicy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: 'http://dazzleddate.com/tos',
      status: 'No Page Loaded',
      backButtonEnabled: false,
      forwardButtonEnabled: false,
      loading: true,
      scalesPageToFit: true,
      inputText: ''
    }
  }
  static navigationOptions = {
    header: null,
  };

  componentWillMount() {
    Global.saveData.nowPage = 'TermsPolicy';
  }

  back() {
    this.props.navigation.goBack(null)
  }
  render() {
    this.inputText = this.state.url;

    return (
      <View style={[styles.container]}>
        <StatusBar backgroundColor='#fff' barStyle='dark-content' />
        <View style={{ backgroundColor: '#fff', flexDirection: 'row', height: 60, marginTop: Platform.select({ ios: 40, android: 10, }), alignItems: 'center', }}>
          <TouchableOpacity style={{ marginTop: 10, marginLeft: 10, width: 40, height: 30 }} onPress={() => this.back()}>
            <Icon type="Ionicons" name="md-arrow-round-back" style={{ color: '#EF7193', }} />
          </TouchableOpacity>
          <View style={{ width: DEVICE_WIDTH - 50, marginLeft: 10, marginTop: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>{"Terms and Conditions/Privacy Policy"}</Text>
          </View>
        </View>
        <WebView
          ref={WEBVIEW_REF}
          automaticallyAdjustContentInsets={false}
          style={styles.webView}
          url={this.state.url}
          javaScriptEnabledAndroid={true}
          onNavigationStateChange={this.onNavigationStateChange}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
          startInLoadingState={true}
          scalesPageToFit={this.state.scalesPageToFit}
        />
      </View>
    );
  }

  goBack = () => {
    this.refs[WEBVIEW_REF].goBack();
  }

  goForward = () => {
    this.refs[WEBVIEW_REF].goForward();
  }

  reload = () => {
    this.refs[WEBVIEW_REF].reload();
  }

  onShouldStartLoadWithRequest = (event) => {
    // Implement any custom loading logic here, don't forget to return!
    return true;
  }
  onNavigationStateChange = (navState) => {
  }

  onSubmitEditing = (event) => {
    this.pressGoButton();
  }

  pressGoButton = () => {
    var url = this.inputText.toLowerCase();
    if (url === this.state.url) {
      this.reload();
    } else {
      this.setState({
        url: url,
      });
    }
    // dismiss keyoard
    this.refs[TEXT_INPUT_REF].blur();
  }

}
const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  addressBarRow: {
    flexDirection: 'row',
    padding: 8,
  },
  webView: {
    backgroundColor: BGWASH,
  },
  addressBarTextInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 3,
    borderWidth: 1,
    height: '100%',
    paddingLeft: 10,
    paddingTop: 3,
    textAlign: 'center',
    paddingBottom: 3,
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  navButton: {
    width: 20,
    padding: 3,
    marginRight: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BGWASH,
    borderColor: 'transparent',
    borderRadius: 3,
  },
  disabledButton: {
    width: 20,
    padding: 3,
    marginRight: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DISABLED_WASH,
    borderColor: 'transparent',
    borderRadius: 3,
  },
  goButton: {
    height: 24,
    padding: 3,
    marginLeft: 8,
    alignItems: 'center',
    backgroundColor: BGWASH,
    borderColor: 'transparent',
    borderRadius: 3,
    alignSelf: 'stretch',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
    height: 22,
  },
  statusBarText: {
    color: 'white',
    fontSize: 13,
  },
  spinner: {
    width: 20,
    marginRight: 6,
  },
  menuItem: {
    width: '20%',
    height: 55,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 0.5,
    borderColor: 'gray',
  },
  lmenuItem: {
    width: '22%',
    marginLeft: '-2%',
    height: 55,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 0.5,
    borderColor: 'gray',
  },
  rmenuItem: {
    width: '22%',
    height: 55,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 0.5,
    borderColor: 'gray',
  },
});
export default TermsPolicy;
