import {Request, Response} from 'express-serve-static-core';
import {DeepTimestampToMillis} from '../types/types';
import {deepTimestampToMillis} from '../utils/utils';
import {HttpError, HttpStatusCode} from './http-error';
import {loggerAndUser} from './api-middlware';

export const sendResponse = <T>(req: Request, res: Response<DeepTimestampToMillis<T>>, result: Promise<T>) => {
  const {logger} = loggerAndUser(req);
  result
    .then(data => {
      const result = deepTimestampToMillis(data);
      logger?.log('api-result', result);
      res.send(result);
    })
    .catch(e => {
      logger?.error('error', e);
      if (e instanceof HttpError) {
        res.status(e.status).send(e.param as any);
      } else {
        res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .send({code: 'internal', message: 'internal-server-error'} as any);
      }
    });
};
