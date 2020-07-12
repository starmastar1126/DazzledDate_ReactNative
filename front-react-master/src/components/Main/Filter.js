import React, { Component } from "react";
import {
  Text
} from "native-base"
import { 
  ImageBackground,
  BackHandler,
  Image,
  Platform,
  Dimensions,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar
} from "react-native";
import logo from '../../assets/images/logo.png';
import slogo from '../../assets/images/second_bg.png';
import { Dropdown } from 'react-native-material-dropdown';
import { ButtonGroup } from 'react-native-elements';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Global from '../Global';

import {SERVER_URL} from '../../config/constants';

class Filter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedIndex: 0,
      fromage: 0,
      toage: 0,
      gender: '',
      languageData: [],
      language: '',
      cityData: [],
      city: '',
      country: '',
      countryData: [],
      multiSliderValue: [18, 30],
      sliderOneValue: [50]
    };
    this.updateIndex = this.updateIndex.bind(this)
  }

  static navigationOptions = {
    header: null
  };
  componentDidMount() {
    Global.saveData.nowPage = 'Filter';
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.onBack(); // works best when the goBack is async
      return true;
    });
    this.setState({
      selectedIndex: Global.saveData.f_gender - 1,
      multiSliderValue: [Global.saveData.f_fromage, Global.saveData.f_toage],
      sliderOneValue: [Global.saveData.f_distance]
    });
    this.get_ethnicity();
    this.get_country();
    this.get_language();
  }
  componentWillUnmount() {
    this.backHandler.remove();
  }
  get_ethnicity() {
    fetch(`${SERVER_URL}/api/ethnicity/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        //alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var data = responseJson.data;
          var itmes = [{ value: 'All' }];
          for (var i = 0; i < data.length; i++) {
            itmes.push({ value: data[i].ethnicity_name });
          }
          this.setState({ city: Global.saveData.f_city, cityData: itmes });
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }
  get_country() {
    fetch(`${SERVER_URL}/api/country/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        // alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var data = responseJson.data;
          var itmes = [{ value: 'All' }];
          for (var i = 0; i < data.length; i++) {
            itmes.push({ value: data[i].country_name })
          }
          this.setState({ country: Global.saveData.f_county, countryData: itmes })
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }

  get_language() {
    fetch(`${SERVER_URL}/api/language/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Global.saveData.token
      }
    }).then((response) => response.json())
      .then((responseJson) => {
        //  alert(JSON.stringify(responseJson))
        if (!responseJson.error) {
          var data = responseJson.data;
          var itmes = [{ value: 'All' }];
          for (var i = 0; i < data.length; i++) {
            itmes.push({ value: data[i].language_name })
          }
          this.setState({ language: Global.saveData.f_language, languageData: itmes })
        }
      })
      .catch((error) => {
        alert(JSON.stringify(error))
        return
      });
  }

  enableScroll = () => this.setState({ scrollEnabled: true });
  disableScroll = () => this.setState({ scrollEnabled: false });
  updateIndex(selectedIndex) {
    this.setState({ selectedIndex })
  }
  onBack() {
    this.props.navigation.replace("Browse");
  }
  multiSliderValuesChange = values => {
    this.setState({
      multiSliderValue: values,
    });
  };
  nonCollidingMultiSliderValuesChange = values => {
    this.setState({
      nonCollidingMultiSliderValue: values,
    });
  };
  sliderOneValuesChangeStart = () => {
    this.setState({
      sliderOneChanging: true,
    });
  };

  sliderOneValuesChange = values => {
    let newValues = [0];
    newValues[0] = values[0];
    this.setState({
      sliderOneValue: newValues,
    });
  };

  sliderOneValuesChangeFinish = () => {
    this.setState({
      sliderOneChanging: false,
    });
  };
  onApply() {
    var lanD = this.state.languageData
    var lanindex = 1;
    for (var i = 0; i < lanD.length; i++) {
      if (lanD[i].value == this.state.language) {
        lanindex = i
        break;
      }
    }

    var cityD = this.state.cityData
    var cityindex = 1;
    for (var i = 0; i < cityD.length; i++) {
      if (cityD[i].value == this.state.city) {
        cityindex = i
        break;
      }
    }

    var countryD = this.state.countryData
    var coutryindex = 1;
    for (var i = 0; i < countryD.length; i++) {
      if (countryD[i].value == this.state.country) {
        coutryindex = i
        break;
      }
    }

    Global.saveData.isFilter = true;
    Global.saveData.removedFilter = false;
    Global.saveData.filterData = {
      "Gender": this.state.selectedIndex + 1,
      "fromAge": this.state.multiSliderValue[0],
      "toAge": this.state.multiSliderValue[1],
      "Distance": this.state.sliderOneValue[0],
      "lang": lanindex,
      "City": cityindex,
      "Country": coutryindex
    }

    Global.saveData.f_gender = this.state.selectedIndex + 1
    Global.saveData.f_fromage = this.state.multiSliderValue[0]
    Global.saveData.f_toage = this.state.multiSliderValue[1]
    Global.saveData.f_distance = this.state.sliderOneValue[0]
    Global.saveData.f_city = this.state.city
    Global.saveData.f_language = this.state.language
    Global.saveData.f_county = this.state.country
    this.onBack()
  }

  removeAllFilters() {
    Global.saveData.removedFilter = true
    this.onBack()
  }
  render() {
    const buttons = ['MALE', 'FEMALE']
    const { selectedIndex } = this.state
    return (
      <View style={styles.contentContainer}>
        <StatusBar backgroundColor='#fff' barStyle='dark-content' />
        <ImageBackground source={slogo} style={{ width: DEVICE_WIDTH, height: 150, marginTop: Platform.select({ 'android': 0, 'ios': 30 }), alignItems: 'center', justifyContent: 'center' }}>
          <Image source={logo} style={{ width: 205, height: 83, tintColor: '#DE5859' }} />
        </ImageBackground>
        <ScrollView scrollEnabled={this.state.scrollEnabled}>
          <View style={{ width: DEVICE_WIDTH, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{"MATCH OPTIONS"}</Text>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"GENDER"}</Text>
            </View>
          </View>
          <View style={{ width: DEVICE_WIDTH, alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
            <ButtonGroup
              onPress={this.updateIndex}
              selectedIndex={selectedIndex}
              buttons={buttons}
              selectedButtonStyle={{ backgroundColor: '#DE5859', }}
              containerStyle={{ height: 40, width: DEVICE_WIDTH * 0.8, borderRadius: 20, borderColor: '#DE5859' }}
              selectedTextStyle={{ color: '#fff', fontSize: 14, }}
              textStyle={{ color: '#DE5859', fontSize: 14, }}
            />
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"AGE"}</Text>
              <Text style={{ color: '#808080', fontSize: 12 }}>{this.state.multiSliderValue[0] + " - " + this.state.multiSliderValue[1]}</Text>
            </View>
            <View>
              <MultiSlider
                values={[
                  this.state.multiSliderValue[0],
                  this.state.multiSliderValue[1],
                ]}
                selectedStyle={{ backgroundColor: '#DE5859' }}
                trackStyle={{
                  height: 1,
                }}
                customMarker={() => {
                  return (<TouchableOpacity style={{ width: 20, height: 20, opacity: 0.7, borderRadius: 10, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity style={{ width: 5, height: 5, backgroundColor: '#f00', borderRadius: 2 }} />
                  </TouchableOpacity>)
                }}
                sliderLength={DEVICE_WIDTH * 0.8}
                onValuesChange={this.multiSliderValuesChange}
                min={18}
                max={60}
                step={1}
                allowOverlap
                snapped
              />
            </View>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"DISTANCE"}</Text>
              {(this.state.sliderOneValue[0] != 2000) &&
                <Text style={{ color: '#808080', fontSize: 12 }}>{"" + this.state.sliderOneValue + " mile"}</Text>}
              {(this.state.sliderOneValue[0] == 2000) &&
                <Text style={{ color: '#808080', fontSize: 12 }}>{"NO LIMIT"}</Text>}
            </View>
            <View>
              <MultiSlider
                values={this.state.sliderOneValue}
                sliderLength={DEVICE_WIDTH * 0.8}
                selectedStyle={{ backgroundColor: '#DE5859' }}
                trackStyle={{
                  height: 1,
                }}
                customMarker={() => {
                  return (<TouchableOpacity style={{ width: 20, height: 20, opacity: 0.7, borderRadius: 10, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}>
                    <TouchableOpacity style={{ width: 5, height: 5, backgroundColor: '#f00', borderRadius: 2 }} />
                  </TouchableOpacity>
                  )
                }}
                min={0}
                max={2000}
                onValuesChangeStart={this.sliderOneValuesChangeStart}
                onValuesChange={this.sliderOneValuesChange}
                onValuesChangeFinish={this.sliderOneValuesChangeFinish}
              />
            </View>
          </View>
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"LANGUAGE"}</Text>
            </View>
            <View>
              <Dropdown
                containerStyle={{ width: "100%", marginTop: -15 }}
                label=' '
                style={{ color: '#808080', fontSize: 10 }}
                inputContainerStyle={{ borderBottomColor: '#808080', }}
                baseColor="#DE5859"//indicator color
                textColor="#000"
                data={this.state.languageData}
                onChangeText={(language) => this.setState({ language })}
                value={this.state.language}
                dropdownPosition={-4}
              />
            </View>
          </View>

          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"ETHNICITY"}</Text>
            </View>
            <View>
              <Dropdown
                containerStyle={{ width: "100%", marginTop: -15 }}
                label=' '
                style={{ color: '#808080', fontSize: 10 }}
                inputContainerStyle={{ borderBottomColor: '#808080', }}
                baseColor="#DE5859"//indicator color
                textColor="#000"
                data={this.state.cityData}
                onChangeText={(city) => this.setState({ city })}
                value={this.state.city}
                dropdownPosition={-4}
              />
            </View>
          </View>

          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#808080', fontSize: 12 }}>{"COUNTRY"}</Text>
            </View>
            <View>
              <Dropdown
                containerStyle={{ width: "100%", marginTop: -15 }}
                label=' '
                pickerStyle={{ marginTop: -50, }}
                style={{ color: '#808080', fontSize: 10 }}
                inputContainerStyle={{ borderBottomColor: '#808080', }}
                baseColor="#DE5859"//indicator color
                textColor="#000"
                data={this.state.countryData}
                onChangeText={(country) => this.setState({ country })}
                value={this.state.country}
                dropdownPosition={-4}
              />
            </View>
          </View>
          {/* <View style={{width:DEVICE_WIDTH*0.8,marginLeft:DEVICE_WIDTH*0.1, marginTop:10, flexDirection:'row', justifyContent:'space-between'}}>
             <View/>
             <TouchableOpacity style={{width:180, height:30, backgroundColor:'#DE5859', alignItems:'center', justifyContent:'center', borderRadius:5}}
              onPress={()=>this.removeAllFilters()}
             >
               <Text style={{color:'#fff'}}>{"Remove All Filters"}</Text>
             </TouchableOpacity>
          </View> */}
          <View style={{ width: DEVICE_WIDTH * 0.8, marginLeft: DEVICE_WIDTH * 0.1, height: 20, alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 180 }}>
              <TouchableOpacity style={{ width: 80, height: 20, borderRadius: 5, borderColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => this.onBack()}
              >
                <Text style={{ color: '#808080', fontSize: 12, fontWeight: 'bold' }}>{"CANCEL"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ width: 80, height: 20, borderRadius: 5, backgroundColor: '#DE5859', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => this.onApply()}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{"APPLY"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
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
export default Filter;
