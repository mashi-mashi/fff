import {PubSub} from '@google-cloud/pubsub';
import {Message} from 'firebase-functions/lib/providers/pubsub';
import {Logger} from '../../logger/logger';
import {chunk} from '../../utils/utils';

const logger = Logger.create('PubsubClient');

export class PubsubClient {
  private client: PubSub;

  constructor(credentials?: {projectId?: string; private_key?: string; client_email?: string}) {
    this.client = new PubSub(
      credentials
        ? {
            projectId: credentials?.projectId,
            credentials,
          }
        : undefined
    );
  }

  public publishJSON = async <T extends object>({topicName, json}: {topicName: string; json: T}) => {
    if (!json) {
      return;
    }

    const topic = this.client.topic(topicName);

    logger.log('publishJSON', json);
    return await topic.publishJSON(json);
  };

  public publishArray = async <T extends {values: any[]}>({topicName, json}: {topicName: string; json: T}) => {
    if (!json.values?.length) {
      return;
    }

    const topic = this.client.topic(topicName);

    const reqs = chunk(json.values, 200).map(array => ({
      values: array,
    }));

    const res = await Promise.all(reqs.map(req => topic.publishJSON(req)));

    return res;
  };

  public static parse = <T>(message: Message): T => {
    if (!message?.data) {
      throw new Error('Message does not exist.');
    }

    const data = JSON.parse(Buffer.from(message.data, 'base64').toString()) as T;
    logger.log(`recieved pubsub messages (buffer)`, message);
    return data;
  };

  public static makeBuffer = (message: any) => {
    return Buffer.from(
      JSON.stringify({
        data: {
          message: message,
        },
      }),
      'utf8'
    );
  };
}
