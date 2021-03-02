import {firestore} from 'firebase-admin';
import {DeepTimestampToMillis} from '../types/firestore-types';
import Timestamp = firestore.Timestamp;

const safeStringify = (obj: any, indent = 0): string => {
  let cache: any = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === 'object' && value !== null
        ? cache.includes(value)
          ? undefined
          : cache.push(value) && value
        : value,
    indent
  );
  cache = null;
  return retVal;
};

const chunk = <T extends any[]>(array: T, size: number): T[] =>
  array.reduce((newarr, _, i) => (i % size ? newarr : [...newarr, array.slice(i, i + size)]), []);

const deepDeleteUndefined = (data: Record<string, any>) => {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) {
      delete data[k];
    } else if (v instanceof Array) {
      for (const val of v) {
        deepDeleteUndefined(val);
      }
    } else if (v instanceof Object) {
      deepDeleteUndefined(v);
    }
  }
  return data;
};

const deepTimestampToMillis = <T>(data: T): DeepTimestampToMillis<T> => {
  if (data instanceof Array) {
    return data.map(d => deepTimestampToMillis(d)) as DeepTimestampToMillis<T>;
  } else if (data instanceof Timestamp) {
    return data.toMillis() as DeepTimestampToMillis<T>;
  } else if (Object.prototype.toString.call(data) === '[object Object]') {
    return Object.entries(data).reduce((previousValue, [k, v]) => {
      if (v instanceof Timestamp) {
        previousValue[k] = v.toMillis();
      } else {
        previousValue[k] = deepTimestampToMillis(v);
      }
      return previousValue;
    }, {} as Record<string, unknown>) as DeepTimestampToMillis<T>;
  } else {
    return data as DeepTimestampToMillis<T>;
  }
};

export {deepDeleteUndefined, deepTimestampToMillis, chunk, safeStringify};
