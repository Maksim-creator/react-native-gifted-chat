import {IMessage} from 'react-native-gifted-chat';

export enum MessageTypes {
  VOICE = 'voice',
  VIDEO = 'video',
}

export interface ChatMessage extends IMessage {
  type?: MessageTypes;
}
