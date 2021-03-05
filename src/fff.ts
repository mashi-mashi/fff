import admin, {ServiceAccount} from 'firebase-admin';

export class FFF {
  public static initialize = (option?: {
    serviceAccount?: ServiceAccount;
    databaseUrl?: string;
    storageBucketName?: string;
    firestoreRootPath?: string;
  }): void => {
    FFF.firestoreRootPath = option?.firestoreRootPath ? `${option.firestoreRootPath}/` : '';
    if (!admin.apps.length) {
      admin.initializeApp(
        option?.serviceAccount
          ? {
              credential: admin.credential.cert(option.serviceAccount),
              databaseURL: option?.databaseUrl,
              storageBucket: option?.storageBucketName,
            }
          : undefined
      );
    }
  };

  public static firestoreRootPath: string;
}
