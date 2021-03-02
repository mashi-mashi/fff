import {NextFunction, Request, Response} from 'express';
import * as admin from 'firebase-admin';
import {Logger} from '../logger/logger';

const loggerAndUser = <T extends Request = Request>(req: T) =>
  req as T & {user: admin.auth.DecodedIdToken} & {logger: Logger};

const verifyFirebaseAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization');
  const logger = Logger.create('[middleware-auth]');

  if (!token) {
    res.status(400);
    res.send('required-auth-token');
    return;
  }
  admin
    .auth()
    .verifyIdToken(token.replace('Bearer ', ''))
    .then(v => {
      (req as any).user = v;
      logger.log(`userId ${v.uid}`);
      next();
    })
    .catch(e => {
      logger.error(`Failed to authenticate.`, e);
      res.status(401);
      res.send(e?.message);
      res.end();
    });
};

const middleware = (req: Request, _: Response, next: NextFunction) => {
  const ip = req.headers['x-appengine-user-ip'];
  const logger = Logger.create(`[${req.method}] [${req.path}]`);
  if (Object.prototype.toString.call(req.body).slice(8, -1).toLowerCase() === 'object' && req.body.password) {
    const loggingBody = {...req.body};
    loggingBody.password = 'x'.repeat(req.body.password.length);
    logger.log('body=', loggingBody, 'query=', req.query, 'ip=', ip);
  } else {
    logger.log('body=', req.body, 'query=', req.query, 'ip=', ip);
  }
  (req as Request & {logger: Logger}).logger = logger;
  (req as Request & {requestIp: string}).requestIp = ip as string;
  next();
};

export {loggerAndUser, verifyFirebaseAuth, middleware};
