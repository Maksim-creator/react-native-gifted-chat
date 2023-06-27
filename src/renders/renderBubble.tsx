import {Bubble, BubbleProps, IMessage} from 'react-native-gifted-chat';
import {Menu} from 'react-native-paper';
import styles from '../../styles';
import React, {Context} from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ChatMessage, MessageTypes} from '../utils/entities';

const renderLeadingIcon = () => (
  <Icon name={'trash-can-outline'} size={25} color={'red'} />
);

export const renderBubble =
  (
    messageMenuRef: React.MutableRefObject<null>,
    openMessageMenu: (id: number) => void,
    closeMessageMenu: () => void,
    removeMessage: (id: number) => void,
    messageMenuVisible?: number,
  ) =>
  (props: BubbleProps<ChatMessage>) => {
    const isVideoMessage = props.currentMessage?.type === MessageTypes.VIDEO;
    const isAudioMessage = props.currentMessage?.type === MessageTypes.VOICE;

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
            wrapperStyle={{
              right: {
                backgroundColor: isVideoMessage ? 'transparent' : '#57d6da',
              },
            }}
          />
        }>
        <Menu.Item
          onPress={() => removeMessage(+props.currentMessage?._id!)}
          title="Remove"
          titleStyle={styles.messageEditMenuItem}
          leadingIcon={renderLeadingIcon}
          style={styles.menuItem}
        />
      </Menu>
    );
  };
