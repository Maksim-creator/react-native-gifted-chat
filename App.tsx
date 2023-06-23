import React, {Context, useCallback, useEffect, useRef, useState} from 'react';
import {
  Actions,
  Bubble,
  BubbleProps,
  GiftedChat,
  IMessage,
  InputToolbar,
  InputToolbarProps,
  MessageAudioProps,
  MessageVideoProps,
  SendProps,
  Time,
  TimeProps,
} from 'react-native-gifted-chat';
import socket from './src/utils/soketIO';
import {
  Alert,
  Easing,
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
import {
  isMessageEmpty,
  renderTimeData,
  renderTimeStyles,
} from './src/utils/helpers';
import Header from './src/components/Header';
import AudioRecorderPlayer from 'react-native-audio-recorder-player/index';
import {Animated} from 'react-native';

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

const newMessageProps = {
  user: {_id: 1, name: 'React Native'},
  sent: true,
  createdAt: new Date(),
};

const audioRecorderPlayer = new AudioRecorderPlayer();

function App(): JSX.Element {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [background, setBackground] = useState(IMAGE_BACKGROUND);
  const [messageType, setMessageType] = useState<MessageTypes>(
    MessageTypes.VOICE,
  );
  const [text, setText] = useState('');
  const [isPlayed, setVideoPlayed] = useState(false);
  const [messageMenuVisible, setMessageMenuVisible] = useState<
    number | undefined
  >(undefined);
  const [audioPlayed, setAudioPlayed] = useState<undefined | number>(undefined);
  const messageMenuRef = useRef(null);

  const playVideo = () => setVideoPlayed(true);
  const stopVideo = () => setVideoPlayed(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const closeMessageMenu = () => setMessageMenuVisible(undefined);
  const openMessageMenu = (id: number) => setMessageMenuVisible(id);

  const sendButtonScale = useRef(new Animated.Value(1));

  useEffect(() => {
    socket.on('connection', () => {
      console.log('socket connected');
    });
    socket.on('chat message', m => {
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [
          {
            text: m,
            _id: Math.random() * 1000000,
            ...newMessageProps,
          },
        ]),
      );
    });
  }, []);

  const [typing, setTyping] = useState(false);
  let timeout: any;

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

    if (response.didCancel) {
      Alert.alert('canceled');
    } else {
      const file = response.assets![0];

      if (file.type === 'video/mp4') {
        onSend([
          {
            video: file.uri!,
            _id: Math.random() * 1000000,
            ...newMessageProps,
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
              ...newMessageProps,
            },
          ]);
        }
      }
    }
    closeMenu();
  };

  const onSend = useCallback(
    (msgs: IMessage[]) => {
      // socket.emit('chat message', msgs[msgs.length - 1].text);
      if (isMessageEmpty(msgs[0])) {
        if (messageType === MessageTypes.VOICE) {
          setMessageType(MessageTypes.VIDEO);
        } else {
          setMessageType(MessageTypes.VOICE);
        }
      } else {
        setText('');
        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, msgs),
        );
      }
    },
    [messageType],
  );

  const renderSend = useCallback(
    (props: SendProps<IMessage>) => {
      return (
        <Animated.View
          style={[
            styles.sendContainerStyle,
            {transform: [{scale: sendButtonScale.current}]},
          ]}>
          <TouchableOpacity
            onLongPress={onStartRecord}
            onPressOut={!text.length ? onStopRecord : undefined}
            onPress={() => {
              onSend([
                {
                  text: props.text!,
                  _id: Math.random() * 1000000,
                  ...newMessageProps,
                },
              ]);
            }}>
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
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [messageType, text.length],
  );

  const renderInputToolbar = (props: InputToolbarProps<IMessage>) => {
    return (
      <InputToolbar
        {...props}
        renderActions={actionsProps => (
          <Actions
            {...actionsProps}
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
    );
  };

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

  const removeMessage = (id: number) => () => {
    setMessages(prevState => prevState.filter(item => item._id !== id));
  };

  const renderBubble = (props: BubbleProps<IMessage>) => {
    return (
      <Menu
        contentStyle={[styles.menu, styles.messageEditMenu]}
        visible={props.currentMessage?._id === messageMenuVisible}
        onDismiss={closeMessageMenu}
        anchor={
          <Bubble
            {...props}
            ref={messageMenuRef}
            onLongPress={(context: Context<IMessage>, message: IMessage) => {
              openMessageMenu(+message._id);
            }}
            tickStyle={
              !props.currentMessage?.text! &&
              !props.currentMessage?.audio &&
              styles.tickStyle
            }
          />
        }>
        <Menu.Item
          onPress={removeMessage(+props.currentMessage?._id!)}
          title="Remove"
          titleStyle={styles.messageEditMenuItem}
          leadingIcon={() => (
            <Icon name={'trash-can-outline'} size={25} color={'red'} />
          )}
          style={styles.menuItem}
        />
      </Menu>
    );
  };

  const renderTime = (props: TimeProps<IMessage>) => {
    return (
      <Time
        {...props}
        {...renderTimeStyles(
          !props.currentMessage?.text,
          !!props.currentMessage?.audio,
        )}
        timeFormat={renderTimeData(props.currentMessage!.createdAt)}
      />
    );
  };
  const audioDuration = useRef(0);

  const onStartRecord = () => {
    Animated.timing(sendButtonScale.current, {
      duration: 200,
      useNativeDriver: true,
      toValue: 1.3,
      easing: Easing.linear,
    }).start(async () => {
      const result = await audioRecorderPlayer.startRecorder(
        `${Math.floor(Math.random() * 10000)}.m4a`,
      );

      audioRecorderPlayer.addRecordBackListener(e => {
        audioDuration.current = +(Math.floor(e.currentPosition) / 100000)
          .toString()
          .slice(0, 4);
        return;
      });
    });
  };

  const onStopRecord = async () => {
    Animated.timing(sendButtonScale.current, {
      toValue: 1,
      useNativeDriver: true,
      easing: Easing.linear,
      duration: 200,
    }).start(async () => {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setMessages(prev =>
        GiftedChat.append(prev, [
          {
            audio: result,
            ...newMessageProps,
            _id: Math.random() * 100000,
            text: audioDuration.current.toString(),
          },
        ]),
      );
    });
  };

  const renderMessageAudio = useCallback(
    (props: MessageAudioProps<IMessage>) => {
      return (
        <View style={styles.messageAudio}>
          <TouchableOpacity
            onPress={
              audioPlayed === props.currentMessage?._id
                ? () => onPausePlay()
                : () =>
                    onStartPlay(
                      +props.currentMessage!._id!,
                      props.currentMessage?.audio?.split('/').slice(-1)[0]!,
                    )
            }
            style={styles.playAudioButton}>
            <Icon
              name={
                audioPlayed === props.currentMessage?._id ? 'pause' : 'play'
              }
              color={'white'}
              size={25}
            />
          </TouchableOpacity>
          <Text style={styles.renderMessageAudioText}>
            {props.currentMessage?.text}
          </Text>
        </View>
      );
    },
    [audioPlayed],
  );

  const onStartPlay = async (audioId: number, uri: string) => {
    setAudioPlayed(audioId);

    await audioRecorderPlayer.startPlayer(uri);
    audioRecorderPlayer.addPlayBackListener(e => {
      if (e.duration === e.currentPosition) {
        onStopPlay();
      }
      return;
    });
  };

  const onPausePlay = async () => {
    setAudioPlayed(undefined);
    await audioRecorderPlayer.pausePlayer();
  };

  const onStopPlay = async () => {
    setAudioPlayed(undefined);
    await audioRecorderPlayer.stopPlayer();
    await audioRecorderPlayer.removePlayBackListener();
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
          <Header
            menuVisible={visible}
            closeMenu={closeMenu}
            openMenu={openMenu}
            chooseImage={chooseImage}
          />
          <GiftedChat
            messages={messages}
            onSend={msgs => onSend(msgs)}
            onInputTextChanged={handleInputChange}
            user={{
              _id: 1,
            }}
            isTyping={typing}
            renderSend={renderSend}
            text={text}
            alwaysShowSend={true}
            renderMessageVideo={renderMessageVideo}
            renderMessageAudio={renderMessageAudio}
            renderInputToolbar={renderInputToolbar}
            renderBubble={renderBubble}
            renderTime={renderTime}
          />
        </SafeAreaView>
      </ImageBackground>
    </PaperProvider>
  );
}

export default App;
