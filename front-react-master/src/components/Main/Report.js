import React, { Component } from "react";
import {
  Text,
  Icon
} from "native-base"
import { 
  Dimensions, 
  TextInput, 
  ScrollView, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Alert
} from "react-native";

import {SERVER_URL} from '../../config/constants';

class Report extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      problem_title: '',
      problem_content: '',
    };
  }

  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'Report';
    this.setState({ id: this.props.navigation.state.params.otherId })
  }
  onBack() {
    this.props.navigation.pop()
  }
  onReport() {
    if (this.state.problem_content == "") {
      Alert.alert("Please fill the input field")
      return
    }
    var details = {
      'otherId': this.state.id,
      'reportDescription': this.state.problem_content
    };

    var formBody = [];
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    fetch(`${SERVER_URL}/api/chat/reportUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody,
    }).then((response) => response.json())
      .then((responseJson) => {
        // alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          Alert.alert("Success report!")
        }
        else {
          Alert.alert(responseJson.message)
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }
  render() {
    return (
      <View style={styles.contentContainer}>
        <StatusBar backgroundColor='#fff' barStyle='dark-content' />
        <View style={{ marginTop: 40, flexDirection: 'row', height: 40 }}>
          <TouchableOpacity style={{ height: 40, width: 40, marginLeft: 10, alignItems: 'center', }}
            onPress={() => this.onBack()}
          >
            <Icon type="Ionicons" name="ios-arrow-back" />
          </TouchableOpacity>
          <View style={{ width: DEVICE_WIDTH - 80, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontWeight: 'bold' }}>{"REPORT A PROBLEM"}</Text>
          </View>
        </View>
        <ScrollView>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 30 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{"Description of Problem"}</Text>
            <TextInput
              style={{
                backgroundColor: 'transparent', width: DEVICE_WIDTH * 0.8, height: 180,
                marginTop: 10, paddingLeft: 2, borderWidth: 1, borderColor: '#808080', paddingLeft: 10, borderRadius: 8, color: '#000'
              }}
              selectionColor="#009788"
              multiline={true}
              value={this.state.problem_content}
              placeholder=""
              placeholderTextColor="#808080"
              onChangeText={problem_content => this.setState({ problem_content })}
              autoCapitalize="none"
              underlineColorAndroid="transparent"
            />
          </View>
          <View style={{ marginTop: 50, alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity style={{ width: 100, height: 40, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
              onPress={() => this.onReport()}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{"SEND"}</Text>
            </TouchableOpacity>
          </View>
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
export default Report;
