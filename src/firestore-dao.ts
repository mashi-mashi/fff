import {Firestore} from './firestore/firestore';
import {FirestoreRefenrece} from './firestore/firestore-reference';
import {FirestoreDocumentType, NestedPartial, OptionalId} from './types/firestore-types';

export class FirestoreDao<T extends FirestoreDocumentType> {
  private ref: FirestoreRefenrece<T>;

  private constructor({path}: {path: string}) {
    this.ref = new FirestoreRefenrece<T>(path);
  }
  public static initialize({path}: {path: string}) {
    return new FirestoreDao({path});
  }

  private createId = () => this.ref.newDoc().id;

  public add = async (data: OptionalId<T>) => {
    const id = data.id || this.createId();
    return await Firestore.add(this.ref.doc(id), data);
  };

  public set = async (data: NestedPartial<T> & {id: string}) => {
    return await Firestore.set(this.ref.doc(data.id), data);
  };

  public delete = async (id: string) => {
    return await Firestore.delete(this.ref.doc(id));
  };

  public forceDelete = async (id: string) => {
    return await Firestore.forceDelete(this.ref.doc(id));
  };

  public get = async (id: string) => {
    return await Firestore.get(this.ref.doc(id));
  };

  public getDocs = async (ids: string[]) => {
    return await Firestore.getDocs(this.ref.collection(), ids);
  };
}
