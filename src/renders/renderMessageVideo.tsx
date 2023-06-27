import {MessageVideoProps} from 'react-native-gifted-chat';
import {ChatMessage} from '../utils/entities';
import {TouchableOpacity, View} from 'react-native';
import styles from '../../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import React from 'react';

export const renderMessageVideo =
  (playVideo: () => void, isPlayed: boolean, stopVideo: () => void) =>
  (props: MessageVideoProps<ChatMessage>) => {
    const isVideoMessage = props?.currentMessage?.type === 'video';
    console.log(isVideoMessage);
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={playVideo}
        style={styles.videoContainer}>
        <View style={styles.videoIconContainer}>
          <Icon name={'play'} size={25} color={'white'} />
        </View>
        {!isVideoMessage && <View style={styles.overlay} />}
        <Video
          source={{uri: props.currentMessage?.video}}
          fullscreen={isPlayed}
          style={isVideoMessage ? styles.videomessage : styles.video}
          resizeMode={'cover'}
          paused={true}
          repeat={true}
          onEnd={stopVideo}
        />
      </TouchableOpacity>
    );
  };
