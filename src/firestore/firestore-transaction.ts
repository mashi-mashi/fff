import {v4 as uuidv4} from 'uuid';
import {DocumentReference} from '../types/types';
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

  add(ref: DocumentReference<any>, data: any) {
    return this.transaction.set(ref, Firestore.beforeAdd(data));
  }

  set(ref: DocumentReference<any>, data: any) {
    return this.transaction.set(ref, Firestore.beforeSet(data));
  }
}
