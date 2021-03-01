## 概要

- firebase-admin を使いやすくするラッパー
  - webSDK は現在開発中

## Install

`npm i @mashi-mashi/firebase-wapper`

## Usage

### Logger

- 通常の `console` と利用方法は基本同じ
- CloudFunctions での severity を自動的に付与する
- 再起的なオブジェクトも気にせず利用できる

```typescript
import {Logger} from '@mashi-mashi/firebase-wapper/lib/index';
const logger = Logger.create('log name');
// {"severity":"INFO","message":"\"log name\" \"1\""}
logger.log('1');
// add prefix message
logger.setPrefix('add prefix');
// {"severity":"INFO","message":"\"log name\" \"add prefix\" \"2\""}
logger.log('2');
```

### Firestore

- firestore の`set`/`add`/`query`をいい感じに使う

```typescript
import {Firestore} from '@mashi-mashi/firebase-wapper/lib/index';
import {FirestoreRefenrece} from '@mashi-mashi/firebase-wapper/lib/firestore/firestore-reference';
import {FirestoreDocumentType} from '@mashi-mashi/firebase-wapper/lib/types/firestore-types';

type TestDocument = FirestoreDocumentType & {
  title: string;
  index?: number;
};

(async () => {
  // Declaring references
  const ref = new FirestoreRefenrece<TestDocument>('test');

  // Adding Document Data
  await Firestore.add(ref.newDoc(), {title: 'test', index: 1});

  // Retrieving Documentation
  const docs = await Firestore.getByQuery(ref.collection().where('title', '==', 'test'));
  // Type inference works.
  const titles = docs.map(doc => doc.title);
  const firstDoc = docs[0];
  // The default parameters will be given
  const createdAt = firstDoc.createdAt;

  // Updating Document Data
  const updateDoc = await Firestore.set(ref.doc(firstDoc.id), {title: 'rewrite'});

  const subRef = new FirestoreRefenrece<SubDocument>('test', 'id1', 'sub');
  // Save the subcollection
  // path /test/id1/sub/
  await Firestore.add(subRef.newDoc(), {description: 'description'});
})();
```
