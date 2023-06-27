import {IMessage} from 'react-native-gifted-chat';
import {reverse} from 'lodash';

export const isMessageEmpty = (message: IMessage) => {
  return !message.text && !message.video && !message.image;
};

export const renderTimeStyles = (isTextEmpty: boolean, isAudio: boolean) =>
  isTextEmpty && !isAudio
    ? {
        containerStyle: {
          right: {
            position: 'absolute' as 'absolute',
            backgroundColor: 'rgba(0,0,0,0.25)',
            padding: 5,
            borderBottomLeftRadius: 12,
            borderTopLeftRadius: 12,
            bottom: 3,
            right: 10,
          },
        },
        timeTextStyle: {
          right: {color: '#ffffff', fontSize: 10, fontWeight: 'bold' as 'bold'},
        },
      }
    : {};

export const renderTimeData = (time: number | Date) =>
  `${new Date(time).getHours()}:${new Date(time).getUTCMinutes()}`;

export const checkNextAudioMessage = (
  messages: IMessage[],
  audioId: number,
) => {
  const copied = reverse([...messages]);

  const currentAudioIdx = copied.findIndex(el => el._id === audioId);
  const restOfMessages = copied.slice(currentAudioIdx + 1);
  return restOfMessages.find(el => el.audio);
};
