import admin, {ServiceAccount} from 'firebase-admin';
import {FirestoreReference} from './firestore/firestore-reference';

export class FFF {
  public static init = ({
    serviceAccount,
    databaseUrl,
    storageBucketName,
    firestoreRootPath,
  }: {
    serviceAccount?: ServiceAccount;
    databaseUrl?: string;
    storageBucketName?: string;
    firestoreRootPath?: string;
  }): void => {
    if (!admin.apps.length) {
      admin.initializeApp(
        serviceAccount
          ? {
              credential: admin.credential.cert(serviceAccount),
              databaseURL: databaseUrl,
              storageBucket: storageBucketName,
            }
          : undefined
      );

      FFF.firestoreRootPath = firestoreRootPath ? `${firestoreRootPath}/` : '';
    }
  };

  public static firestoreRootPath: string;
}
