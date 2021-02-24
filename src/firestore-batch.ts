import {DocumentReference} from '@google-cloud/firestore';
import admin from 'firebase-admin';
import {FirestoreTypes, NestedPartial} from './utils/type-utils';
import {Firestore} from './firestore';
import WriteBatch = FirebaseFirestore.WriteBatch;

export class FirestoreBatch {
  private batch: WriteBatch;

  constructor() {
    this.batch = admin.firestore().batch();
  }

  public add = <T extends FirestoreTypes>(ref: DocumentReference<T>, data: T) => {
    const addData = Firestore.beforeAdd(data);
    this.batch.set(ref, addData);
    return this;
  };

  public set = <T>(ref: DocumentReference<T>, data: NestedPartial<T>, merge?: boolean) => {
    const setData = Firestore.beforeSet(data);
    this.batch.set(ref, setData as T, {merge: Firestore.optimizeMergeOption(merge)});
    return this;
  };

  public delete = <T extends FirestoreTypes>(ref: DocumentReference<T>, data: T) => {
    this.batch.set(ref, {...data, deleted: true, deletedAt: Firestore.now});
    return this;
  };

  public forceDelete = <T extends FirestoreTypes>(ref: DocumentReference<T>) => {
    this.batch.delete(ref);
    return this;
  };

  public commit = async () => {
    const [result] = await Promise.all([this.batch.commit()]);
    return result;
  };
}
