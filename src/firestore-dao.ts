import {Firestore} from './firestore/firestore';
import {FirestoreRefenrece} from './firestore/firestore-reference';
import {Logger} from './logger/logger';
import {FirestoreDocumentType, NestedPartial, OptionalId} from './types/firestore-types';

export class FirestoreDao<T extends FirestoreDocumentType> {
  private ref: FirestoreRefenrece<T>;
  private logger: Logger;

  private constructor({path}: {path: string}) {
    this.ref = new FirestoreRefenrece<T>(path);
    this.logger = Logger.create(`FirestoreDao[${path}]`);
  }
  public static initialize({path}: {path: string}) {
    return new FirestoreDao({path});
  }

  private createId = () => this.ref.newDoc().id;

  public add = async (data: OptionalId<T>) => {
    const id = data.id || this.createId();
    this.logger.log(`create data: ${id}`);
    return await Firestore.add(this.ref.doc(id), data);
  };

  public set = async (data: NestedPartial<T> & {id: string}) => {
    this.logger.log(`set data: ${data.id}`);
    return await Firestore.set(this.ref.doc(data.id), data);
  };

  public delete = async (id: string) => {
    this.logger.log(`delete data: ${id}`);
    return await Firestore.delete(this.ref.doc(id));
  };

  public forceDelete = async (id: string) => {
    this.logger.log(`force delete data: ${id}`);
    return await Firestore.forceDelete(this.ref.doc(id));
  };

  public get = async (id: string) => {
    this.logger.log(`get data: ${id}`);
    return await Firestore.get(this.ref.doc(id));
  };

  public getDocs = async (ids: string[]) => {
    this.logger.log(`get data-array: ${ids}`);
    return await Firestore.getDocs(this.ref.collection(), ids);
  };
}
