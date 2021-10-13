import {CollectionReference, DocumentReference, Query, QueryDocumentSnapshot} from '@google-cloud/firestore';
import {firestore} from 'firebase-admin';
import {FFF} from '../fff';
import {
  DeepTimestampToMillis,
  EpochMillis,
  FirestoreDocumentType,
  NestedPartial,
  OptionalId,
  WithMetadata,
} from '../types/types';
import {deepTimestampToMillis, destructiveDeepDeleteUndefined} from '../utils/utils';
import {FirestoreBatch} from './firestore-batch';

export class Firestore {
  public static getFirestoreInstance = () => firestore();
  public static collection = (collectionPath: string) => firestore().collection(FFF.firestoreRootPath + collectionPath);
  public static now = () => firestore.Timestamp.now();
  public static randomId = () => firestore().collection('random').doc().id;

  private static timestampToEpochMills = <T>(
    snapshot: firestore.DocumentSnapshot<T> | firestore.QueryDocumentSnapshot<T>
  ): DeepTimestampToMillis<T | undefined> => {
    const data = snapshot.data();
    if (data) {
      return deepTimestampToMillis<T>({...data, id: snapshot.id});
    } else {
      return undefined;
    }
  };

  /**
   * @param data
   */
  public static beforeAdd = <T extends OptionalId<FirestoreDocumentType>>(data: T): T => {
    const addData = {...data} as WithMetadata<T>;

    destructiveDeepDeleteUndefined(addData);
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
    destructiveDeepDeleteUndefined(setData);
    setData.updatedAt = Firestore.now();
    return setData as NestedPartial<T>;
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
    await ref.set(setData as T, {merge: option?.merge ?? true});
    return setData as WithMetadata<NestedPartial<T>>;
  };

  public static update = async <T extends FirestoreDocumentType>(
    ref: DocumentReference<T>,
    data: NestedPartial<T>
  ): Promise<WithMetadata<NestedPartial<T>>> => {
    const setData = Firestore.beforeSet(data);
    await ref.update(setData as T);
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

  public static getEpochMills = async <T extends FirestoreDocumentType>(
    ref: DocumentReference<T>
  ): Promise<DeepTimestampToMillis<WithMetadata<T>> | undefined> => {
    const doc = await ref.get();
    const d = Firestore.timestampToEpochMills(doc);
    return d as DeepTimestampToMillis<WithMetadata<T>>;
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

  public static getDocsEpochMills = async <T extends FirestoreDocumentType>(
    collectionRef: CollectionReference<T>,
    ids: string[]
  ): Promise<DeepTimestampToMillis<WithMetadata<T>>[]> => {
    if (!ids || !ids.length) {
      return [];
    }

    const uniqIds = Array.from(new Set(ids));

    const refs = uniqIds.map(id => firestore().doc(`${collectionRef.path}/${id}`));
    const docs = await firestore().getAll(...refs);
    return docs.map(doc => Firestore.timestampToEpochMills(doc) as unknown as DeepTimestampToMillis<WithMetadata<T>>);
  };

  public static getByQuery = async <T extends FirestoreDocumentType>(ref: Query<T>): Promise<WithMetadata<T>[]> => {
    const data = await ref.get();
    return data.docs.filter(d => d.exists).map(doc => ({...doc.data(), id: doc.id} as WithMetadata<T>));
  };

  /**
   * 日付をEpochMillsに変更
   * @param ref
   * @returns
   */
  public static getByQueryEpochMills = async <T extends FirestoreDocumentType>(
    ref: Query<T>
  ): Promise<DeepTimestampToMillis<WithMetadata<T>>[]> => {
    const data = await ref.get();
    return data.docs
      .filter(d => d.exists)
      .map(doc => Firestore.timestampToEpochMills(doc) as unknown as DeepTimestampToMillis<WithMetadata<T>>);
  };

  public static pagingQuery = async <T extends any>({
    ref,
    lastId,
  }: {
    ref: CollectionReference<T>;
    lastId?: string;
  }): Promise<FirebaseFirestore.Query<T>> => {
    if (!lastId) {
      return ref.limit(1000);
    }

    const snapshot = await ref.doc(lastId).get();
    return ref.startAfter(snapshot).limit(1000);
  };

  public static queryWithSnapshot = async <T extends FirestoreDocumentType>(
    ref: Query<T>,
    lastDoc: QueryDocumentSnapshot<T>,
    page: {
      sortKey: string;
      order: 'desc' | 'asc';
      limit: number;
    }
  ): Promise<WithMetadata<T>[]> => {
    const data =
      page.order === 'desc'
        ? await ref.orderBy(page.sortKey, 'desc').startAfter(lastDoc).limit(page.limit).get()
        : await ref.orderBy(page.sortKey, 'asc').endBefore(lastDoc).limit(page.limit).get();
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

  public static nextRef = async <T extends any>({
    ref,
    id,
  }: {
    ref: CollectionReference<T>;
    id?: string;
  }): Promise<FirebaseFirestore.Query<T>> => {
    if (!id) {
      return ref.limit(1000);
    }

    const snapshot = await ref.doc(id).get();
    return ref.startAfter(snapshot).limit(1000);
  };
}
