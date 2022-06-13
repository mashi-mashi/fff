import {DocumentReference} from '@google-cloud/firestore';
import admin from 'firebase-admin';
import {RequireId, NestedPartial, OptionalId} from '../types/types';
import {Firestore} from './firestore';
import WriteBatch = FirebaseFirestore.WriteBatch;

const FIRESTORE_BATCH_LIMIT = 500;

export class FirestoreBatch {
  private batchArray: WriteBatch[];
  private batchIndex: number = 0;
  private count: number = 0;
  private _limit: number;

  constructor({limit}: {limit: number} = {limit: FIRESTORE_BATCH_LIMIT}) {
    this.batchArray = [];
    this._limit = limit;
  }

  private incrementCount = () => this.count++;
  private reset = () => {
    this.count = 0;
    this.batchIndex = 0;
  };

  private getBatch = (): WriteBatch => {
    if (this.count >= this._limit) {
      this.batchIndex++;
      this.count = 0;
    }

    const current = this.batchArray[this.batchIndex];
    if (!current) {
      this.batchArray[this.batchIndex] = admin.firestore().batch();
    }

    return this.batchArray[this.batchIndex];
  };

  public add = <T extends OptionalId<RequireId>>(ref: DocumentReference<T>, data: OptionalId<T>): this => {
    const addData = Firestore.beforeAdd(data);
    this.getBatch().set(ref, addData as T);
    this.incrementCount();
    return this;
  };

  public set = <T>(ref: DocumentReference<T>, data: NestedPartial<T>, option?: {merge: boolean}): this => {
    const setData = Firestore.beforeSet(data);
    this.getBatch().set(ref, setData as T, {merge: option?.merge ?? true});
    this.incrementCount();
    return this;
  };

  public delete = <T extends RequireId>(ref: DocumentReference<T>, data: T): this => {
    const now = Firestore.now();
    this.getBatch().set(ref, {...data, updatedAt: now, deleted: true, deletedAt: now});
    this.incrementCount();
    return this;
  };

  public forceDelete = <T extends RequireId>(ref: DocumentReference<T>): this => {
    this.getBatch().delete(ref);
    this.incrementCount();
    return this;
  };

  public commit = async (): Promise<FirebaseFirestore.WriteResult[]> => {
    const results = await Promise.all(this.batchArray.map(batch => batch.commit()));
    this.reset();
    return results.flat();
  };
}
