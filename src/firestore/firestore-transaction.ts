import {v4 as uuidv4} from 'uuid';
import {DocumentReference, NestedPartial} from '../types/types';
import {Firestore} from './firestore';

export class FirestoreTransaction {
  constructor(protected transaction: FirebaseFirestore.Transaction, protected uuid = uuidv4()) {}

  async get<T>(ref: DocumentReference<T>) {
    const res = await this.transaction.get(ref);
    const data = res.data();
    return data ? ({...data, id: res.id} as T) : undefined;
  }

  async getAll<T>(ref: DocumentReference<T>[]) {
    return (await this.transaction.getAll(...ref)).map(res => ({...res.data(), id: res.id} as unknown as T));
  }

  add<T extends {id?: string}>(ref: DocumentReference<T>, data: T) {
    return this.transaction.set(ref, Firestore.beforeAdd(data), {merge: true});
  }

  set<T extends {id: string}>(ref: DocumentReference<T>, data: NestedPartial<T>) {
    return this.transaction.set(ref, Firestore.beforeSet(data) as Partial<T>, {merge: true});
  }

  delete(ref: DocumentReference<any>) {
    return this.transaction.delete(ref);
  }
}
