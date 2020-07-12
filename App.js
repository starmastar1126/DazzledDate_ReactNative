if (__DEV__) {
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

import React from 'react';
import { View, AsyncStorage, PermissionsAndroid } from 'react-native';
import * as firebase from 'firebase';
import nativeFirebase from 'react-native-firebase';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import AppView from './AppView';
import Global from './src/components/Global';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  async componentWillMount() {
    console.disableYellowBox = true;
    var firebaseConfig = {
      apiKey: "AIzaSyBLEM8NoFevrJ0uyvetYKrFUdeDuSVdL1Q",
      authDomain: "dz-chat-app.firebaseapp.com",
      databaseURL: "https://dz-chat-app.firebaseio.com",
      projectId: "dz-chat-app",
      storageBucket: "",
      messagingSenderId: "289099129817",
      appId: "1:289099129817:web:7ffff5d747763479"
    };
    firebase.initializeApp(firebaseConfig);
    this.setState({ loading: false });
  }

  componentDidMount() {
    this.checkCameraPermission();
    this.checkPermission();
    this.createNotificationListeners();
  }

  componentWillUnmount() {
    this.notificationListener();
    this.notificationOpenedListener();
  }

  async checkCameraPermission() {
    try {
      var permissions = [];
      const isCameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      const isRecordAudioPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      const isAccessFineLocationPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (!isCameraPermission) {
        permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }
      if (!isRecordAudioPermission) {
        permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }
      if (!isAccessFineLocationPermission) {
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      if (permissions.length === 0) {
        return;
      }
      await this.requestPermissions(permissions);
    } catch (error) {
      // Error retrieving data
      console.error(error);
    }
  }

  async requestPermissions(permissions) {
    try {
      const granted = await PermissionsAndroid.requestMultiple(
        permissions,
        {
          title: 'Cool App Some Permissions',
          message:
            'Cool App needs access to your some permissions.',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted['android.permission.CAMERA'] 
      && granted['android.permission.RECORD_AUDIO'] 
      && granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED) {
        alert('You can use the all');
      } else {
        alert('all permission denied');
      }
    } catch (error) {
      // Error retrieving data
      console.error(error);
    }
  }

  async checkPermission() {
    const enabled = await nativeFirebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async requestPermission() {
    try {
      await nativeFirebase.messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      alert('Firebase permission rejected');
    }
  }

  async getToken() {
    let fcmToken = await AsyncStorage.getItem('fcmToken');
    if (!fcmToken) {
      fcmToken = await nativeFirebase.messaging().getToken();
      if (fcmToken) {
        // user has a device token
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    }
  }

  async createNotificationListeners() {
    this.notificationListener = nativeFirebase.notifications().onNotification((notification) => {
      const { title, body, data } = notification;
      if (data) {
        const type = data.type;
        this.checkNotification(title, body, type);
      }
    });

    this.notificationOpenedListener = nativeFirebase.notifications().onNotificationOpened((notificationOpen) => {
      const { title, body, data } = notificationOpen.notification;
      if (data) {
        const type = data.type;
        this.checkNotification(title, body, type);
      }
    });

    const notificationOpen = await nativeFirebase.notifications().getInitialNotification();
    if (notificationOpen) {
      const { title, body, data } = notificationOpen.notification;
      if (data) {
        const type = data.type;
        this.checkNotification(title, body, type);
      }
    }

    this.messageListener = nativeFirebase.messaging().onMessage((message) => {
      //process data message
      alert(JSON.stringify(message));
    });
  }

  checkNotification = (title, body, type) => {
    const { nowPage } = Global.saveData;
    if (nowPage !== type) {
      showMessage({
        message: title,
        description: body,
        type: "default",
        icon: 'info'
      });
    }
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <AppView />
        <FlashMessage position="top" />
      </View>
    );
  }
}
