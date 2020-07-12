package com.pys.dazzleddate;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.agontuk.RNFusedLocation.RNFusedLocationPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.evollu.react.fcm.FIRMessagingPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.brentvatne.react.ReactVideoPackage;
import com.zyu.ReactNativeWheelPickerPackage;
import com.rnfs.RNFSPackage;
import org.reactnative.camera.RNCameraPackage;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.imagepicker.ImagePickerPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNFusedLocationPackage(),
            new RNGestureHandlerPackage(),
            new FIRMessagingPackage(),
            new RNFirebasePackage(),
            new RNFirebaseNotificationsPackage(),
            new RNFirebaseMessagingPackage(),
            new RNDeviceInfo(),
            new ReactVideoPackage(),
            new ReactNativeWheelPickerPackage(),
            new RNFSPackage(),
            new RNCameraPackage(),
            new AsyncStoragePackage(),
            new ImagePickerPackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
