import {FFF} from '../fff';
import {CollectionReference, DocumentReference} from '../types/types';
import {Firestore} from './firestore';

type WithId<T> = T & {id: string};

export class FirestoreReference<T> {
  private name: string;
  constructor(name: string) {
    this.name = FFF.firestoreRootPath + name;
  }

  public getPath = (): string => Firestore.collection(this.name).path;

  public collection = (): CollectionReference<WithId<T>> =>
    Firestore.collection(this.name) as CollectionReference<WithId<T>>;
  public doc = (id: string): DocumentReference<WithId<T>> => this.collection().doc(id) as DocumentReference<WithId<T>>;
  public newDoc = (): DocumentReference<WithId<T>> => this.collection().doc() as DocumentReference<WithId<T>>;
}

export class FirestoreNestReference<T> {
  private name: string;
  private parentPath: (parentId: string) => DocumentReference<any>;
  constructor(parentRef: FirestoreReference<any>, name: string) {
    this.parentPath = (parentId: string) => parentRef.doc(parentId);
    this.name = name;
  }

  public getPath = ({parentId}: {parentId: string}): string => this.parentPath(parentId).collection(this.name).path;

  public collection = ({parentId}: {parentId: string}): CollectionReference<WithId<T>> =>
    this.parentPath(parentId).collection(this.name) as CollectionReference<WithId<T>>;
  public doc = ({parentId, id}: {parentId: string, id: string}): DocumentReference<WithId<T>> =>
    this.parentPath(parentId).collection(this.name).doc(id) as DocumentReference<WithId<T>>;
  public newDoc = ({parentId}: {parentId: string}): DocumentReference<WithId<T>> =>
    this.parentPath(parentId).collection(this.name).doc() as DocumentReference<WithId<T>>;
}
