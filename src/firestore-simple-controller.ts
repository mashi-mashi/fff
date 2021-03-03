import {Request, Response} from 'express-serve-static-core';
import {sendResponse} from './api/api-helper';
import {FirestoreDao} from './firestore-dao';
import {FirestoreDocumentType, NestedPartial, OptionalId} from './types/types';

export class FirestoreSimpleController<T extends FirestoreDocumentType> {
  private dao: FirestoreDao<T>;
  private collectionPath: string;

  private constructor({collectionPath}: {collectionPath: string}) {
    this.collectionPath = collectionPath;
    this.dao = FirestoreDao.initialize<T>({path: collectionPath});
  }

  public static initialize<U extends FirestoreDocumentType>({collectionPath}: {collectionPath: string}) {
    return new FirestoreSimpleController<U>({collectionPath});
  }

  public create = async (req: Request, res: Response, data: OptionalId<T>) => {
    return sendResponse(req, res, this.dao.add(data));
  };

  public update = async (req: Request, res: Response, data: NestedPartial<T> & {id: string}) => {
    return sendResponse(req, res, this.dao.set(data));
  };

  public delete = async (req: Request, res: Response, id: string) => {
    return sendResponse(req, res, this.dao.delete(id));
  };
}
