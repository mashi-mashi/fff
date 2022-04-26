import FirebaseFirestore from '@google-cloud/firestore';

export type FirestoreTimestampType = FirebaseFirestore.Timestamp;

export type EpochMillis = number;

export type RequireId = {
  id: string;
};

export type OptionalId<T> = Omit<T, 'id'> & {id?: string};

export type WithMetadata<T> = RequireId & {
  createdAt: FirestoreTimestampType;
  updatedAt: FirestoreTimestampType;
  deletedAt?: FirestoreTimestampType;
} & T;

export type CollectionReference<T extends RequireId> = FirebaseFirestore.CollectionReference<T>;
export type DocumentReference<T extends RequireId> = FirebaseFirestore.DocumentReference<T>;
export type Query<T extends RequireId> = FirebaseFirestore.Query<T>;

// https://stackoverflow.com/questions/47914536/use-partial-in-nested-property-with-typescript
export type NestedPartial<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]?: T[K] extends (infer R)[] ? NestedPartial<R>[] : NestedPartial<T[K]>;
    }
  : T;

export type NestedReadonly<T> = {
  [K in keyof T]: T[K] extends Array<infer R> ? Readonly<Array<NestedReadonly<R>>> : Readonly<NestedReadonly<T[K]>>;
};

// https://off.tokyo/blog/typescript-saiki-utility-types/
type isTimestamp<T> = T extends FirestoreTimestampType
  ? T
  : T extends FirestoreTimestampType | undefined
  ? EpochMillis | undefined
  : never;

export type DeepTimestampToMillis<T> = T extends Array<infer R>
  ? Array<DeepTimestampToMillis<R>>
  : T extends FirestoreTimestampType
  ? EpochMillis
  : T extends Record<string, any>
  ? {
      [P in keyof T]: T[P] extends isTimestamp<T[P]>
        ? EpochMillis
        : T[P] extends Array<infer R>
        ? Array<DeepTimestampToMillis<R>>
        : T[P] extends Record<string, any>
        ? DeepTimestampToMillis<T[P]>
        : T[P];
    }
  : T;
