import {
  Actions,
  InputToolbar,
  InputToolbarProps,
} from 'react-native-gifted-chat';
import {ChatMessage} from '../utils/entities';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../../styles';
import React from 'react';

const renderPaperclip = (chooseImage: (onSend?: any) => void, onSend: any) => {
  return (
    <Icon
      onPress={() => chooseImage(onSend)}
      style={styles.clipIcon}
      name={'paperclip'}
      size={25}
    />
  );
};

export const renderInputToolbar =
  (chooseImage: (onSend?: any) => void, onSend: any) =>
  (props: InputToolbarProps<ChatMessage>) => {
    return (
      <InputToolbar
        {...props}
        renderActions={actionsProps => (
          <Actions
            {...actionsProps}
            icon={() => renderPaperclip(chooseImage, onSend)}
          />
        )}
        containerStyle={styles.inputToolbar}
      />
    );
  };
