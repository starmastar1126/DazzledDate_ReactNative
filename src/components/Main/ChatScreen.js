import React from 'react';
import {
    Icon
} from "native-base";
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableHighlight,
    Keyboard,
    FlatList,
    ScrollView,
    Image,
    BackHandler,
    TouchableOpacity,
    Alert,
    Dimensions,
    Platform
} from 'react-native';
import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';
import Global from '../Global';
import firebase from 'firebase';

import {SERVER_URL} from '../../config/constants';

const DEVICE_WIDTH = Dimensions.get('window').width;
// const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class ChatScreen extends React.Component {
    static navigationOptions = {
        header: null
    };
    constructor(props) {
        super(props);
        this.state = {
            other: {
                userId: props.navigation.state.params.data.data.other_user_id,
                name: props.navigation.state.params.data.data.name,
                imgUrl: props.navigation.state.params.data.imageUrl
            },
            matchId: props.navigation.state.params.data.data.match_id,
            textMessage: '',
            messageList: ''
        }
    }

    _menu = null;

    componentWillMount() {
        Global.saveData.nowPage = 'ChatDetail';
        firebase.database().ref().child(Global.saveData.u_id).child(this.state.other.userId)
            .on('child_added', (value) => {
                this.setState((prevState) => {
                    return {
                        messageList: [...prevState.messageList, value.val()]
                    }
                });
            });
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow.bind(this));
        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide.bind(this));
        BackHandler.addEventListener('hardwareBackPress', this.backPressed);
        // this.getMessageData();
    }

    componentDidMount() {        
        setTimeout(function () {
            this.scrollView.scrollToEnd({ animated: true });
        }.bind(this));
    }    

    componentWillUnmount() {
        // firebase.database().ref().child(Global.saveData.u_id).child(this.state.other.userId).remove();
        // firebase.database().ref().child(this.state.other.userId).child(Global.saveData.u_id).remove();
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
        BackHandler.removeEventListener('hardwareBackPress', this.backPressed);
    }

    backPressed = () => {
        if (Global.saveData.prevpage === 'Chat') {
            this.props.navigation.replace("Chat");
        } else {
            this.props.navigation.pop();
        }
    }

    componentDidUpdate() {
        setTimeout(function () {
            this.scrollView.scrollToEnd({ animated: true });
        }.bind(this));
    }

    keyboardDidShow(e) {
        if (this.scrollView) {
            this.scrollView.scrollToEnd({ animated: true });
        }       
    }

    keyboardDidHide(e) {
        if (this.scrollView) {
            this.scrollView.scrollToEnd({ animated: true });
        }  
    }

    setMenuRef = ref => {
        this._menu = ref;
    };

    hideMenu = () => {
        this._menu.hide();
    };

    showMenu = () => {
        this._menu.show();
    };    

    handleChange = key => val => {
        this.setState({
            [key]: val
        });
    }

    setBlock = () => {
        this.hideMenu();
        Alert.alert(
            'Are you sure you want to block this user?',
            'Once blocked, all chat history will disappear from the chat list',
            [
                { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
                { text: 'Confirm', onPress: () => this.requestBlock },
            ],
            { cancelable: false }
        );
    }

    requestBlock = () => {
        var details = {
            'otherId': this.state.other.userId
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
                    this.backPressed();
                }
                else {
                    Alert.alert(responseJson.message);
                }
            }).catch((error) => {
                alert(JSON.stringify(error));
                return
            });
    }

    setReport = () => {
        this.hideMenu();
        this.props.navigation.navigate("Report", { id: this.state.other.userId });
    }

    getMessageData = async () => {
        const { matchId } = this.state;
        await fetch(`${SERVER_URL}/api/chat/getChatWithMatchId/${matchId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Global.saveData.token
            }
        }).then((response) => response.json())
            .then((responseJson) => {
                if (!responseJson.error) {
                    const msgData = responseJson.data.content;
                    var convertedList = [];
                    if (msgData.length) {
                        msgData.map((item) => {
                            var convertedData = {
                                from: parseInt(item.message_type) === 1 ? Global.saveData.u_id : this.state.other.userId,
                                message: item.message_text,
                                time: item.created_date
                            };
                            convertedList.push(convertedData);
                        });
                        this.setState({
                            messageList: convertedList
                        });
                    }
                }
            }).catch((error) => {
                return
            });
    }

    formatAMPM(time) {
        var date = new Date(time);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    setChatDate(item) {
        var date = new Date(item.time);
        var now = new Date();
        var nowYear = now.getFullYear();
        var nowMonth = now.getMonth() + 1;
        var nowDate = now.getDate();
        var dateYear = date.getFullYear();
        var dateMonth = date.getMonth() + 1;
        var dateDate = date.getDate();
        if (nowYear === dateYear && nowMonth === dateMonth) {
            if (nowDate === dateDate) {
                return 'Today';
            } else if (nowDate === dateDate + 1) {
                return 'Yesterday';
            }
        }
        return date.toDateString();
    }

    sendMessage = async () => {
        if (this.state.textMessage.length > 0) {
            let msgId = firebase.database().ref('dz-chat-app').child(Global.saveData.u_id).child(this.state.other.userId).push().key;
            let updates = {};
            let message = {
                message: this.state.textMessage,
                time: firebase.database.ServerValue.TIMESTAMP,
                from: Global.saveData.u_id
            };
            updates[Global.saveData.u_id + '/' + this.state.other.userId + '/' + msgId] = message;
            updates[this.state.other.userId + '/' + Global.saveData.u_id + '/' + msgId] = message;
            firebase.database().ref().update(updates);
            this.createNewMessage();
        }
    }

    createNewMessage = () => {
        const { textMessage, matchId } = this.state;
        var details = {
            'matchId': matchId,
            'messageText': textMessage
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
                this.setState({ textMessage: '' });
            })
            .catch((error) => {
                alert(JSON.stringify(error))
                return
            });
    }

    gotoProfilePage = () => {
        Global.saveData.prevpage = "ChatDetail";
        this.props.navigation.navigate("Profile", { id: this.state.other.userId, name: this.state.other.name });
    }

    renderRow = ({ item }) => {
        return (
            <View style={{
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                {/* <View style={{alignSelf: 'center', paddingLeft: 10, paddingRight: 10}}>
                    <Text style={{color: '#000', fontSize: 14}}>{this.setChatDate(item)}</Text>
                </View> */}
                <View style={{
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignSelf: item.from === Global.saveData.u_id ? 'flex-end' : 'flex-start',
                    margin: 10,
                    marginLeft: 15,
                    maxWidth: '70%'
                }}>
                    <Text style={{
                        padding: 3,
                        fontSize: 12,
                        color: '#000',
                        alignSelf: 'flex-end',
                    }}>
                        {this.formatAMPM(item.time)}
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        backgroundColor: item.from === Global.saveData.u_id ? '#FFF' : '#B64F54',
                        borderRadius: 20,
                        padding: 8,
                        paddingLeft: item.from === Global.saveData.u_id ? 10 : 35,
                        shadowColor: "#efefef",
                        shadowOpacity: 0.8,
                        shadowRadius: 2,
                        shadowOffset: {
                            height: 1,
                            width: 1
                        }
                    }} elevation={5}>
                        {item.from === this.state.other.userId && (
                            <TouchableHighlight style={styles.avatarBtn} onPress={() => this.gotoProfilePage()}>
                                <Image
                                    style={styles.avatar}
                                    source={{ uri: this.state.other.imgUrl }}
                                />
                            </TouchableHighlight>
                        )}
                        <View>
                            <Text style={{ padding: 7, fontSize: 15, color: item.from === Global.saveData.u_id ? '#000' : '#FFF', }}>
                                {item.message}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.outer}>
                <View style={{ width: DEVICE_WIDTH, height: 60, flexDirection: 'row', marginTop: Platform.select({ 'android': 10, 'ios': 40, }), alignItems: 'center' }}>
                    <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 60, zIndex: 1000, marginLeft: 10 }}
                        onPress={this.backPressed}>
                        <Icon type="Ionicons" name="ios-arrow-back" />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', justifyContent: 'center', width: DEVICE_WIDTH - 100, flexDirection: 'row' }}>
                        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 24, marginLeft: 5, marginTop: 5 }}>{this.state.other.name}</Text>
                    </View>
                    <View style={styles.menuIcon}>
                        <Menu
                            ref={this.setMenuRef}
                            button={<TouchableOpacity style={{ width: 40, marginLeft: 10, }} onPress={this.showMenu}>
                                <Icon type="MaterialCommunityIcons" name="dots-horizontal" />
                            </TouchableOpacity>}>
                            <MenuItem onPress={this.setBlock}>Block</MenuItem>
                            <MenuDivider />
                            <MenuItem onPress={this.setReport}>Report</MenuItem>
                        </Menu>
                    </View>
                </View>
                <ScrollView style={{ marginTop: 15 }} ref={(ref) => { this.scrollView = ref }}>
                    <FlatList
                        style={{ padding: 10 }}
                        data={this.state.messageList}
                        renderItem={this.renderRow}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </ScrollView>
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.textBox}
                        value={this.state.textMessage}
                        onChangeText={this.handleChange('textMessage')}
                    />
                    <TouchableHighlight style={styles.sendButton} onPress={this.sendMessage}>
                        <Icon type="Ionicons" name="ios-send" style={{ color: 'white' }} />
                    </TouchableHighlight>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    outer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'white'
    },
    menuIcon: {
        alignSelf: 'flex-end',
        marginRight: 10
    },
    input: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        width: '80%',
        marginBottom: 10,
        borderRadius: 20
    },
    inputBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 15,
        paddingTop: 5,
        paddingBottom: 5,
        marginLeft: -35,
        paddingRight: 15,
        borderRadius: 400,
        height: 50,
        backgroundColor: '#B64F54'
    },
    textBox: {
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#efefef',
        flex: 1,
        fontSize: 15,
        paddingHorizontal: 8
    },
    chatbox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftContainer: {
        flex: 5,
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },
    rightContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    avatarBtn: {
        position: 'absolute',
        width: 45,
        height: 45,
        left: -15,
        top: 1,
    },
    avatar: {                 
        width: 45,
        height: 45,
        borderRadius: 400
    }
});