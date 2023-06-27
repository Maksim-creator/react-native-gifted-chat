import {IMessage, MessageAudioProps} from 'react-native-gifted-chat';
import {Text, TouchableOpacity, View} from 'react-native';
import styles from '../../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import React from 'react';

export const renderMessageAudio =
  (
    onPausePlay: () => void,
    onStartPlay: (id: number, url: string) => void,
    audioPlayed?: number,
  ) =>
  (props: MessageAudioProps<IMessage>) => {
    return (
      <View style={styles.messageAudio}>
        <TouchableOpacity
          onPress={
            audioPlayed === props.currentMessage?._id
              ? () => onPausePlay()
              : () =>
                  onStartPlay(
                    +props.currentMessage!._id,
                    props.currentMessage?.audio?.split('/').slice(-1)[0]!,
                  )
          }
          style={styles.playAudioButton}>
          <Icon
            name={audioPlayed === props.currentMessage?._id ? 'pause' : 'play'}
            color={'white'}
            size={25}
          />
        </TouchableOpacity>
        <Text style={styles.renderMessageAudioText}>
          {props.currentMessage?.text}
        </Text>
      </View>
    );
  };
