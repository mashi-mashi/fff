import {Message} from 'firebase-functions/lib/providers/pubsub';
import {Logger} from '../logger/logger';

const logger = Logger.create('[pubsub]');

export class Pubsub {
  public static parse = <T>(message: Message): T | undefined => {
    if (!message?.data) {
      return;
    }

    const data = JSON.parse(Buffer.from(message.data, 'base64').toString()) as T;
    logger.log(`recieved pubsub messages: ${JSON.stringify(data)}`);
    return data;
  };
}
