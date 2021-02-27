import {Firestore} from './firestore';
import {CollectionReference, DocumentReference, FirestoreDocumentType} from '../utils/firestore-types';

export class FirestoreRefenrece<T extends FirestoreDocumentType> {
  constructor(protected path: string = path) {}
  public getPath = this.path;

  public collection = () => Firestore.collection(this.path) as CollectionReference<T>;
  public doc = (id: string) => this.collection().doc(id) as DocumentReference<T>;
  public newDoc = () => this.collection().doc() as DocumentReference<T>;
}
