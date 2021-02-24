import {firestore} from 'firebase-admin';
import {TimestampToEpochMillis} from './type-utils';
import Timestamp = firestore.Timestamp;

const deleteUndefinedRecursively = (data: Record<string, any>) => {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) {
      delete data[k];
    } else if (v instanceof Array) {
      for (const val of v) {
        deleteUndefinedRecursively(val);
      }
    } else if (v instanceof Object) {
      deleteUndefinedRecursively(v);
    }
  }
  return data;
};

const timestampToMillis = <T>(data: T): TimestampToEpochMillis<T> => {
  if (data instanceof Array) {
    return data.map(d => timestampToMillis(d)) as TimestampToEpochMillis<T>;
  } else if (data instanceof Timestamp) {
    return data.toMillis() as TimestampToEpochMillis<T>;
  } else if (Object.prototype.toString.call(data) === '[object Object]') {
    return Object.entries(data).reduce((previousValue, [k, v]) => {
      if (v instanceof Timestamp) {
        previousValue[k] = v.toMillis();
      } else {
        previousValue[k] = timestampToMillis(v);
      }
      return previousValue;
    }, {} as Record<string, unknown>) as TimestampToEpochMillis<T>;
  } else {
    return data as TimestampToEpochMillis<T>;
  }
};

export {deleteUndefinedRecursively, timestampToMillis}