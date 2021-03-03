import {FFF} from '../fff';
import {CollectionReference, DocumentReference, FirestoreDocumentType} from '../types/firestore-types';
import {Firestore} from './firestore';

type WithId<T> = T & {id: string};

export class FirestoreReference<T = {}> {
  private path: string;
  constructor(...paths: string[]) {
    this.path = FFF.firestoreRootPath + paths.join('/');
  }

  public getPath = (): string => this.path;

  public collection = (): CollectionReference<WithId<T>> =>
    Firestore.collection(this.path) as CollectionReference<T & {id: string}>;
  public doc = (id: string): DocumentReference<WithId<T>> =>
    this.collection().doc(id) as DocumentReference<T & {id: string}>;
  public newDoc = (): DocumentReference<WithId<T>> => this.collection().doc() as DocumentReference<WithId<T>>;
}
