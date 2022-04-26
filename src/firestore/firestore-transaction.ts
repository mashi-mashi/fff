import {FirestoreDocumentType} from '../types/types';
import {Firestore} from './firestore';
export class FirestoreTransaction {
  constructor() {}

  public static runTransaction = async <T extends FirestoreDocumentType>(
    updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
  ) => Firestore.getFirestoreInstance().runTransaction(transaction => updateFunction(transaction));
}
