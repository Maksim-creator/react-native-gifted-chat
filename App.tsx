import React, {useCallback, useEffect, useState} from 'react';
import {
  Actions,
  GiftedChat,
  IMessage,
  InputToolbar,
  MessageVideoProps,
  Send,
  SendProps,
} from 'react-native-gifted-chat';
import socket from './src/utils/soketIO';
import {
  Alert,
  Dimensions,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from './styles';
import {Menu, PaperProvider} from 'react-native-paper';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import Video from 'react-native-video';

const IMAGE_BACKGROUND =
  'https://i.pinimg.com/564x/e0/77/ee/e077eec5651d294de5ffd25b340f9e13.jpg';

enum MessageTypes {
  VOICE = 'voice',
  VIDEO = 'video',
}

const sendIconProps = {
  style: styles.sendIcon,
  size: 25,
  color: 'white',
};

function App(): JSX.Element {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [background, setBackground] = useState(IMAGE_BACKGROUND);
  const [messageType, setMessageType] = useState<MessageTypes>(
    MessageTypes.VOICE,
  );
  const [text, setText] = useState('');
  const [isPlayed, setVideoPlayed] = useState(false);

  const playVideo = () => setVideoPlayed(true);
  const stopVideo = () => setVideoPlayed(false);

  const openMenu = () => setVisible(true);

  const closeMenu = () => setVisible(false);

  useEffect(() => {
    socket.on('connection', () => {
      console.log('socket connected');
    });
    socket.on('chat message', m => {
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [
          {
            _id: new Date().toString(),
            text: m,
            createdAt: new Date(),
            user: {_id: 2, name: 'React Native'},
          },
        ]),
      );
    });
  }, []);

  const [typing, setTyping] = useState(false);
  let timeout;

  function timeoutFunction() {
    setTyping(false);
    socket.emit('typing', 'not typing');
  }

  const handleInputChange = (message: string) => {
    setText(message);
    if (!typing) {
      setTyping(true);
      socket.emit('typing', 'Maksym');
      timeout = setTimeout(timeoutFunction, 5000);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 5000);
    }
  };

  const chooseImage = async (onSend?: any) => {
    let options: ImageLibraryOptions = {
      mediaType: 'mixed',
      quality: 1,
    };
    const response = await launchImageLibrary(options);
    console.log(response);
    if (response.didCancel) {
      Alert.alert('canceled');
    } else {
      const file = response.assets![0];

      if (file.type === 'video/mp4') {
        onSend([
          {
            video: file.uri!,
            _id: Math.random() * 1000000,
            user: {_id: 1, name: 'React Native'},
          },
        ]);
      } else {
        if (!onSend) {
          await AsyncStorage.setItem('bg', file.uri!);
          setBackground(file.uri!);
        } else {
          onSend([
            {
              image: file.uri!,
              _id: Math.random() * 1000000,
              user: {_id: 1, name: 'React Native'},
            },
          ]);
        }
      }
    }
    closeMenu();
  };

  const onSend = useCallback((msgs: IMessage[]) => {
    // socket.emit('chat message', msgs[msgs.length - 1].text);
    console.log(1);
    setMessages(previousMessages => GiftedChat.append(previousMessages, msgs));
  }, []);

  const renderSend = useCallback(
    (props: SendProps<IMessage>) => {
      return (
        <Send {...props} containerStyle={styles.sendContainerStyle}>
          <Icon
            name={
              text.length
                ? 'send'
                : messageType === MessageTypes.VOICE
                ? 'microphone-outline'
                : 'camera-outline'
            }
            {...sendIconProps}
          />
        </Send>
      );
    },
    [messageType, text.length],
  );

  const renderMessageVideo = (props: MessageVideoProps<IMessage>) => {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={playVideo}
        style={styles.videoContainer}>
        <View style={styles.videoIconContainer}>
          <Icon name={'play'} size={25} color={'white'} />
        </View>
        <View style={styles.overlay} />
        <Video
          source={{uri: props.currentMessage?.video}}
          fullscreen={isPlayed}
          style={styles.video}
          resizeMode={'cover'}
          paused={true}
          repeat={true}
          onEnd={stopVideo}
        />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    (async function () {
      const img = await AsyncStorage.getItem('bg');
      if (img) {
        setBackground(img);
      }
    })();
  }, []);

  return (
    <PaperProvider>
      <ImageBackground style={styles.container} source={{uri: background}}>
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.header}>
            <View style={styles.menuContainer}>
              <Menu
                contentStyle={styles.menu}
                visible={visible}
                onDismiss={closeMenu}
                anchor={
                  <TouchableOpacity
                    onPress={visible ? closeMenu : openMenu}
                    style={styles.dropdownButton}>
                    <Icon name={'dots-vertical'} size={30} color={'white'} />
                  </TouchableOpacity>
                }>
                <Menu.Item
                  onPress={() => chooseImage()}
                  title="Change theme"
                  titleStyle={{color: 'white'}}
                  leadingIcon={() => (
                    <Icon name={'palette'} size={25} color={'white'} />
                  )}
                  style={styles.menuItem}
                />
              </Menu>
            </View>
          </View>
          <GiftedChat
            messages={messages}
            onSend={msgs => onSend(msgs)}
            onInputTextChanged={handleInputChange}
            user={{
              _id: 1,
            }}
            isTyping={typing}
            renderSend={renderSend}
            alwaysShowSend={true}
            renderMessageVideo={renderMessageVideo}
            renderInputToolbar={props => (
              <InputToolbar
                {...props}
                // renderSend={renderSend}
                renderActions={actionsProps => (
                  <Actions
                    {...actionsProps}
                    onSend={() => console.log('1')}
                    icon={() => (
                      <Icon
                        onPress={() => chooseImage(onSend)}
                        style={styles.clipIcon}
                        name={'paperclip'}
                        size={25}
                      />
                    )}
                  />
                )}
                containerStyle={styles.inputToolbar}
              />
            )}
          />
        </SafeAreaView>
      </ImageBackground>
    </PaperProvider>
  );
}

export default App;
