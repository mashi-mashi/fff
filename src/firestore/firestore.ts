import {CollectionReference, DocumentReference, Query} from '@google-cloud/firestore';
import {firestore} from 'firebase-admin';
import {EpochMillis, FirestoreDocumentType, NestedPartial, OptionalId, WithMetadata} from '../types/types';
import {deepDeleteUndefined} from '../utils/utils';
import {FirestoreBatch} from './firestore-batch';

export class Firestore {
  public static getFirestoreInstance = () => firestore();
  public static collection = (collectionPath: string) => firestore().collection(collectionPath);
  public static now = () => firestore.Timestamp.now();
  public static randomId = () => firestore().collection('random').doc().id;

  /**
   * @param data
   */
  public static beforeAdd = <T extends OptionalId<FirestoreDocumentType>>(data: T): T => {
    const addData = {...data} as WithMetadata<T>;

    deepDeleteUndefined(addData);
    const now = Firestore.now();
    if ('id' in addData) delete (addData as T & {id?: string}).id;
    return {...addData, createdAt: now, updatedAt: now, deleted: false};
  };

  /**
   * @param data
   */
  public static beforeSet = <T extends FirestoreDocumentType>(data: NestedPartial<T>): NestedPartial<T> => {
    const setData = {...data} as NestedPartial<WithMetadata<T>>;
    if ('id' in setData) delete setData.id;
    if ('createdAt' in setData) delete setData.createdAt;
    if ('deletedAt' in setData) delete setData.deletedAt;
    deepDeleteUndefined(setData);
    setData.updatedAt = Firestore.now();
    return setData as NestedPartial<T>;
  };

  public static optimizeMergeOption = (merge?: boolean) => {
    // undefinedはtrueにする
    return merge ?? true;
  };

  public static add = async <T extends OptionalId<FirestoreDocumentType>>(
    ref: DocumentReference<T>,
    data: OptionalId<T>
  ): Promise<WithMetadata<T>> => {
    const addData = Firestore.beforeAdd(data) as T;
    await ref.set(addData);
    return addData as WithMetadata<T>;
  };

  public static bulkAdd = async <T extends OptionalId<FirestoreDocumentType>>(
    collectionRef: CollectionReference<T>,
    dataArray: OptionalId<T>[]
  ): Promise<WithMetadata<T>[]> => {
    const batch = new FirestoreBatch();

    const addedData = dataArray.map(data => {
      const docRef = data.id ? collectionRef.doc(data.id) : collectionRef.doc();
      batch.add<T>(docRef, data);
      return {...data, id: docRef.id};
    });

    await batch.commit();

    return addedData as WithMetadata<T>[];
  };

  public static set = async <T extends FirestoreDocumentType>(
    ref: DocumentReference<T>,
    data: NestedPartial<T>,
    option?: {merge: boolean}
  ): Promise<WithMetadata<NestedPartial<T>>> => {
    const setData = Firestore.beforeSet(data);
    await ref.set(setData as T, {merge: option?.merge});
    return setData as WithMetadata<NestedPartial<T>>;
  };

  public static bulkSet = async <T extends FirestoreDocumentType>(
    collectionRef: CollectionReference<T>,
    dataArray: NestedPartial<T>[]
  ): Promise<WithMetadata<NestedPartial<T>>[]> => {
    const batch = new FirestoreBatch();

    const updateArray = dataArray.map(data => {
      const docRef = data.id ? collectionRef.doc(data.id) : collectionRef.doc();
      batch.set<T>(docRef, data);
      return {...data, id: docRef.id};
    });

    await batch.commit();

    return updateArray as WithMetadata<NestedPartial<T>>[];
  };

  public static get = async <T extends FirestoreDocumentType>(ref: DocumentReference<T>): Promise<T | undefined> => {
    const doc = await ref.get();
    const data = doc.data();

    return data ? ({...data, id: doc.id} as T) : undefined;
  };

  /**
   * @param collectionRef
   * @param ids
   */
  public static getDocs = async <T extends FirestoreDocumentType>(
    collectionRef: CollectionReference<T>,
    ids: string[]
  ): Promise<T[]> => {
    if (!ids || !ids.length) {
      return [];
    }

    const uniqIds = Array.from(new Set(ids));

    const refs = uniqIds.map(id => firestore().doc(`${collectionRef.path}/${id}`));
    const docs = await firestore().getAll(...refs);

    return docs.map(doc => ({
      ...(doc.data() as T),
      id: doc.id,
    }));
  };

  public static getByQuery = async <T extends FirestoreDocumentType>(ref: Query<T>): Promise<WithMetadata<T>[]> => {
    const data = await ref.get();
    return data.docs.filter(d => d.exists).map(doc => ({...doc.data(), id: doc.id} as WithMetadata<T>));
  };

  public static delete = async <T extends FirestoreDocumentType>(
    ref: DocumentReference<T>
  ): Promise<FirestoreDocumentType> => {
    const current = await Firestore.get(ref);
    if (!current) throw new Error('data-not-found');

    const deleteData = {...current, deleted: true, deletedAt: Firestore.now} as any;
    await Firestore.set(ref, deleteData);
    return {id: ref.id};
  };

  public static bulkDelete = async <T extends FirestoreDocumentType>(
    collectionRef: CollectionReference<T>,
    ids: string[]
  ): Promise<{ids: string[]}> => {
    const currentArray = await Firestore.getDocs(collectionRef, ids);
    if (!currentArray?.length) throw new Error('data-not-found');

    const batch = new FirestoreBatch();
    currentArray.forEach(current =>
      batch.set(collectionRef.doc(current.id), {...current, deleted: true, deletedAt: Firestore.now} as any)
    );

    await batch.commit();

    return {ids};
  };

  public static forceDelete = async <T extends FirestoreDocumentType>(
    ref: DocumentReference<T>
  ): Promise<FirestoreDocumentType> => {
    await ref.delete();
    return {
      id: ref.id,
    };
  };

  public static bulkForceDelete = async <T extends FirestoreDocumentType>(
    collectionRef: CollectionReference<T>,
    ids: string[]
  ): Promise<{ids: string[]}> => {
    const batch = new FirestoreBatch();
    ids.forEach(id => batch.forceDelete(collectionRef.doc(id)));

    await batch.commit();

    return {ids};
  };

  public static deleteFieldValue = () => firestore.FieldValue.delete();

  public static getByFieldValues = async <T extends {id: string}>(
    query: firestore.Query<T>,
    fieldName: string,
    values: any[],
    isFieldArray?: boolean
  ): Promise<T[]> => {
    const results: T[] = [];
    await Promise.all(
      Array.from({length: Math.ceil(values.length / 10)})
        .map((_, idx) => values.slice(idx * 10, (idx + 1) * 10))
        .map(async part => {
          const res = await Firestore.getByQuery(
            query.where(fieldName, isFieldArray ? 'array-contains-any' : 'in', part)
          );
          results.push(...res);
        })
    );
    return results;
  };

  public static timestampFromMillis = (millis: EpochMillis) => firestore.Timestamp.fromMillis(millis);
  public static timestampFromMillisIfNull = (millis?: EpochMillis) =>
    millis ? Firestore.timestampFromMillis(millis) : undefined;
}
