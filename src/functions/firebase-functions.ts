import {Request, Response} from 'express-serve-static-core';
import {firestore, https, pubsub, RuntimeOptions, runWith} from 'firebase-functions';

export class Functions {
  public static topic = (topic: string) => pubsub.topic(topic);
  public static scheduler = (schedule: string) => pubsub.schedule(schedule);
  public static trigger = (path: string) => firestore.document(path);

  public static onRequest = (handler: (req: Request, resp: Response) => void, option?: RuntimeOptions) => {
    if (option) {
      return runWith(option).https.onRequest(handler);
    }
    return https.onRequest(handler);
  };
}
