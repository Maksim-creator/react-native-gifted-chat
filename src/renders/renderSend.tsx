import {SendProps} from 'react-native-gifted-chat';
import {ChatMessage, MessageTypes} from '../utils/entities';
import {Animated, TouchableOpacity} from 'react-native';
import styles from '../../styles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import React from 'react';

const sendIconProps = {
  style: styles.sendIcon,
  size: 25,
  color: 'white',
};

export const renderSend =
  (
    sendButtonScale: React.MutableRefObject<Animated.Value>,
    onStartRecord: () => void,
    onStopRecord: () => void,
    onSendButtonTap: (props: SendProps<ChatMessage>) => void,
    messageType: MessageTypes,
    text: string,
  ) =>
  (props: SendProps<ChatMessage>) => {
    return (
      <Animated.View
        style={[
          styles.sendContainerStyle,
          {transform: [{scale: sendButtonScale.current}]},
        ]}>
        <TouchableOpacity
          onLongPress={onStartRecord}
          onPressOut={onStopRecord}
          onPress={() => onSendButtonTap(props)}>
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
  };
