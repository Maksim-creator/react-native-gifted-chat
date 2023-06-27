import React, {useCallback, useEffect, useRef, useState} from 'react';
import {GiftedChat, SendProps} from 'react-native-gifted-chat';
import socket from './src/utils/soketIO';
import {Alert, Animated, Easing, ImageBackground, View} from 'react-native';
import styles from './styles';
import {PaperProvider} from 'react-native-paper';
import {
  ImageLibraryOptions,
  launchImageLibrary,
} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {checkNextAudioMessage} from './src/utils/helpers';
import Header from './src/components/Header';
import AudioRecorderPlayer from 'react-native-audio-recorder-player/index';
import {Camera, useCameraDevices} from 'react-native-vision-camera';
import {isEmpty} from 'lodash';
import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import {renderMessageAudio} from './src/renders/renderMessageAudio';
import {renderTime} from './src/renders/renderTime';
import {renderBubble} from './src/renders/renderBubble';
import {ChatMessage, MessageTypes} from './src/utils/entities';
import {renderSend} from './src/renders/renderSend';
import {renderMessageVideo} from './src/renders/renderMessageVideo';
import {renderInputToolbar} from './src/renders/renderInputToolbar';

const IMAGE_BACKGROUND =
  'https://i.pinimg.com/564x/e0/77/ee/e077eec5651d294de5ffd25b340f9e13.jpg';

const newMessageProps = {
  user: {_id: 1, name: 'React Native'},
  sent: true,
  createdAt: new Date(),
};

const audioRecorderPlayer = new AudioRecorderPlayer();

function App(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
  const [isCameraRecord, setIsCameraRecord] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [typing, setTyping] = useState(false);

  const playVideo = () => setVideoPlayed(true);
  const stopVideo = () => setVideoPlayed(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const closeMessageMenu = () => setMessageMenuVisible(undefined);
  const openMessageMenu = (id: number) => setMessageMenuVisible(id);

  const sendButtonScale = useRef(new Animated.Value(1));
  const audioDuration = useRef(0);
  const messageMenuRef = useRef(null);
  const cameraRef = useRef<Camera>(null);

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

  const onSend = useCallback((msgs: ChatMessage[]) => {
    // socket.emit('chat message', msgs[msgs.length - 1].text);
    setText('');
    setMessages(previousMessages => GiftedChat.append(previousMessages, msgs));
  }, []);

  const onSendButtonTap = (props: SendProps<ChatMessage>) => {
    if (isEmpty(props.text)) {
      if (messageType === MessageTypes.VOICE) {
        setMessageType(MessageTypes.VIDEO);
      } else if (messageType === MessageTypes.VIDEO) {
        setMessageType(MessageTypes.VOICE);
      }
    } else {
      onSend([
        {
          text: props.text!,
          _id: Math.random() * 1000000,
          ...newMessageProps,
        },
      ]);
    }
  };

  const removeMessage = (id: number) => {
    setMessages(prevState => prevState.filter(item => item._id !== id));
  };

  const onStartRecord = () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.soft);
    Animated.timing(sendButtonScale.current, {
      duration: 200,
      useNativeDriver: true,
      toValue: 2.3,
      easing: Easing.bounce,
    }).start(async () => {
      setIsLongPress(true);
      if (messageType === MessageTypes.VOICE) {
        await audioRecorderPlayer.startRecorder(
          `${Math.floor(Math.random() * 10000)}.m4a`,
        );

        audioRecorderPlayer.addRecordBackListener(e => {
          audioDuration.current = +(Math.floor(e.currentPosition) / 100000)
            .toString()
            .slice(0, 4);
          return;
        });
      } else if (messageType === MessageTypes.VIDEO) {
        setIsCameraRecord(true);
        cameraRef.current?.startRecording({
          flash: 'on',
          onRecordingFinished: video => {
            setMessages(prev =>
              GiftedChat.append(prev, [
                {
                  video: video.path,
                  ...newMessageProps,
                  _id: Math.random() * 100000,
                  text: Math.floor(video.duration).toString(),
                  type: MessageTypes.VIDEO,
                },
              ]),
            );
          },
          onRecordingError: error => console.error(error),
        });
      }
    });
  };

  const onStopRecord = () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.soft);
    Animated.timing(sendButtonScale.current, {
      toValue: 1,
      useNativeDriver: true,
      easing: Easing.bounce,
      duration: 200,
    }).start(async () => {
      if (isLongPress) {
        if (messageType === MessageTypes.VOICE) {
          const result = await audioRecorderPlayer.stopRecorder();
          audioRecorderPlayer.removeRecordBackListener();
          setMessages(prev =>
            GiftedChat.append(prev, [
              {
                audio: result,
                ...newMessageProps,
                _id: Math.random() * 100000,
                text: audioDuration.current.toString(),
                type: MessageTypes.VOICE,
              },
            ]),
          );
        } else if (messageType === MessageTypes.VIDEO) {
          setIsCameraRecord(false);
          await cameraRef.current?.stopRecording();
        }
        setIsLongPress(false);
      }
    });
  };

  const onStartPlay = async (audioId: number, uri: string) => {
    setAudioPlayed(audioId);
    const hasAudioNext = checkNextAudioMessage(messages, audioId);
    await audioRecorderPlayer.startPlayer(uri);
    audioRecorderPlayer.addPlayBackListener(async e => {
      if (e.duration === e.currentPosition) {
        await onStopPlay();
        if (hasAudioNext?.audio) {
          await onStartPlay(+hasAudioNext._id, hasAudioNext.audio);
        }
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
    const requestPermissions = async () => {
      const img = await AsyncStorage.getItem('bg');
      await Camera.getCameraPermissionStatus();
      await Camera.getMicrophonePermissionStatus();
      if (img) {
        setBackground(img);
      }
    };
    requestPermissions();
  }, []);

  const devices = useCameraDevices();
  const device = devices.front;
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

          {device && (
            <View style={isCameraRecord && styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                device={device}
                isActive={isCameraRecord}
                style={isCameraRecord ? styles.camera : styles.disabledCamera}
                video={true}
                audio={true}
              />
            </View>
          )}

          <GiftedChat
            messages={messages}
            onSend={(msgs: ChatMessage[]) => onSend(msgs)}
            onInputTextChanged={handleInputChange}
            user={{
              _id: 1,
            }}
            isTyping={typing}
            renderSend={renderSend(
              sendButtonScale,
              onStartRecord,
              onStopRecord,
              onSendButtonTap,
              messageType,
              text,
            )}
            text={text}
            alwaysShowSend={true}
            renderMessageVideo={renderMessageVideo(
              playVideo,
              isPlayed,
              stopVideo,
            )}
            renderMessageAudio={renderMessageAudio(
              onPausePlay,
              onStartPlay,
              audioPlayed,
            )}
            renderInputToolbar={renderInputToolbar(chooseImage, onSend)}
            renderBubble={renderBubble(
              messageMenuRef,
              openMessageMenu,
              closeMessageMenu,
              removeMessage,
              messageMenuVisible,
            )}
            renderTime={renderTime}
          />
        </SafeAreaView>
      </ImageBackground>
    </PaperProvider>
  );
}

export default App;
