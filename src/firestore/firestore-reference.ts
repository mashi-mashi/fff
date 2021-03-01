import {Firestore} from './firestore';
import {CollectionReference, DocumentReference, FirestoreDocumentType} from '../types/firestore-types';

export class FirestoreRefenrece<T extends FirestoreDocumentType> {
  private path: string;
  constructor(...paths: string[]) {
    this.path = paths.join('/');
  }

  public getPath = (): string => this.path;

  public collection = (): CollectionReference<T> => Firestore.collection(this.path) as CollectionReference<T>;
  public doc = (id: string): DocumentReference<T> => this.collection().doc(id) as DocumentReference<T>;
  public newDoc = (): DocumentReference<T> => this.collection().doc() as DocumentReference<T>;
}
