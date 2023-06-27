import {IMessage, Time, TimeProps} from 'react-native-gifted-chat';
import {renderTimeData, renderTimeStyles} from '../utils/helpers';
import React from 'react';

export const renderTime = (props: TimeProps<IMessage>) => {
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
