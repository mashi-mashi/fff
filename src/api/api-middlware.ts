import {NextFunction, Request, Response} from 'express';
import * as admin from 'firebase-admin';
import {FFF} from '../fff';
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

const verifyFirebaseAuthCustomDomain = (req: Request, res: Response, next: NextFunction) => {
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
      const domain = v.email?.split('@')?.[1] || '';
      logger.log(`userId: ${v.uid} domain: ${domain}`);

      if (domain !== FFF.verifyDomain) {
        res.status(400);
        res.send('undesignated mail domain.');
        return;
      }

      next();
    })
    .catch(e => {
      logger.error(`Failed to authenticate.`, e);
      res.status(401);
      res.send(e?.message);
      res.end();
    });
};

const common = (req: Request, _: Response, next: NextFunction) => {
  const ip = req.headers['x-appengine-user-ip'];
  const logger = Logger.create(`[${req.method}] [${req.path}]`);
  logger.log('body=', req.body, 'query=', req.query, 'ip=', ip);
  (req as any).logger = logger;
  (req as any).requestIp = ip as string;
  next();
};

export {loggerAndUser, verifyFirebaseAuth, common, verifyFirebaseAuthCustomDomain};
