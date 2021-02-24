import {firestore} from 'firebase-admin';
import {DocumentReference, CollectionReference, Query} from '@google-cloud/firestore';
import {EpochMillis, FirestoreTypes, NestedPartial, WithMetadata} from './utils/type-utils';
import {deleteUndefinedRecursively} from './utils/utils';

export class Firestore {
  public static getFirestoreInstance = () => firestore();
  public static collection = (collectionPath: string) => firestore().collection(collectionPath);
  public static now = () => firestore.Timestamp.now();

  /**
   * @param data
   * @param operator
   */
  public static beforeAdd = <T extends FirestoreTypes>(data: T): WithMetadata<T> => {
    const addData = {...data} as WithMetadata<T>;

    deleteUndefinedRecursively(addData);
    const now = Firestore.now();
    return {...addData, createdAt: now, updateAt: now, deleted: false};
  };

  /**
   * @param data
   * @param operator
   */
  public static beforeSet = <T extends FirestoreTypes>(data: NestedPartial<T>): WithMetadata<NestedPartial<T>> => {
    const setData = {...data} as NestedPartial<WithMetadata<T>>;
    delete setData.id;
    deleteUndefinedRecursively(setData);
    setData.updatedAt = Firestore.now();
    delete setData.createdAt;
    delete setData.deletedAt;
    return setData;
  };

  public static toDeletedData = <T extends FirestoreTypes>(data: T): WithMetadata<T> => {
    const deletedData = {...data} as WithMetadata<T>;
    deletedData.deleted = true;
    const now = Firestore.now();
    deleteUndefinedRecursively(deletedData);
    return {...deletedData, deleted: true, deletedAt: now};
  };

  public static optimizeMergeOption = (merge?: boolean) => {
    // undefinedはtrueにする
    // noinspection RedundantConditionalExpressionJS
    return merge === false ? false : true;
  };

  public static add = async <T extends FirestoreTypes>(ref: DocumentReference<T>, data: T) => {
    const addData = Firestore.beforeAdd(data);
    await ref.set(addData);
    return addData;
  };

  public static set = <T extends FirestoreTypes>(ref: DocumentReference<T>, data: NestedPartial<T>) => {
    const setData = Firestore.beforeSet(data);
    return ref.set(setData as T, {merge: true});
  };

  public static get = async <T extends FirestoreTypes>(ref: DocumentReference<T>): Promise<T | undefined> => {
    const doc = await ref.get();
    const data = doc.data();
    if (!data) {
      return undefined;
    }
    data.id = doc.id;
    return data as T;
  };

  /**
   * @param collectionRef
   * @param ids
   */
  public static getDocs = async <T extends FirestoreTypes>(
    collectionRef: CollectionReference<T>,
    ids: string[]
  ): Promise<T[]> => {
    if (!ids || !ids[0]) {
      return [];
    }
    const refs = ids.map(id => firestore().doc(`${collectionRef.path}/${id}`));
    const docs = await firestore().getAll(...refs);
    const dataList: T[] = [];
    for (const doc of docs) {
      const data = doc.data();
      if (data) {
        data.id = doc.id;
        dataList.push(data as T);
      }
    }
    return dataList;
  };

  public static delete = async <T extends FirestoreTypes>(ref: DocumentReference<T>) => {
    const current = await Firestore.get(ref);
    const deleteData = {...current, deleted: true, deletedAt: Firestore.now} as any;
    return await Firestore.set(ref, deleteData);
  };
  public static forceDelete = async <T extends FirestoreTypes>(ref: DocumentReference<T>) => ref.delete();

  public static getByQuery = async <T extends FirestoreTypes>(ref: Query<T>): Promise<T[]> =>
    (await ref.get()).docs.filter(d => d.exists).map(doc => ({...doc.data(), id: doc.id}));

  public static deleteFieldValue = (): any => firestore.FieldValue.delete();

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
  public static timestampFromMillisIfNull = (millis?: EpochMillis) => {
    if (millis) {
      return Firestore.timestampFromMillis(millis);
    } else {
      return undefined;
    }
  };
}
