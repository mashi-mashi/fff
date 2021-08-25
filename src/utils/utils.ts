import {firestore} from 'firebase-admin';
import {DeepTimestampToMillis} from '../types/types';
import Timestamp = firestore.Timestamp;

export const chunk = <T extends any[]>(array: T, size: number): T[] =>
  array.reduce((newarr, _, i) => (i % size ? newarr : [...newarr, array.slice(i, i + size)]), []);

/**
 * 破壊的!!!
 * undefinedのオブジェクトを再起的にデリートする
 * @param data
 */
export const destructiveDeepDeleteUndefined = (data: Record<string, any>) => {
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) {
      delete data[k];
    } else if (v instanceof Array) {
      for (const val of v) {
        destructiveDeepDeleteUndefined(val);
      }
    } else if (v instanceof Object) {
      destructiveDeepDeleteUndefined(v);
    }
  }
};

export const deepDeleteUndefined = (data: Record<string, any>) => {
  const data2 = {...data};
  for (let [k, v] of Object.entries(data)) {
    if (v === undefined) {
      delete data2[k];
      return data2;
    } else if (v instanceof Array) {
      for (let val of v) {
        data2[k] = deepDeleteUndefined(val);
      }
    } else if (v instanceof Object) {
      data2[k] = deepDeleteUndefined(v);
    }
  }
  return data2;
};

export const deepTimestampToMillis = <T>(data: T): DeepTimestampToMillis<T> => {
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

export const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: object | null) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};
