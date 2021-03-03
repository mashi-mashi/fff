import admin, {ServiceAccount} from 'firebase-admin';

export class FFF {
  public static initialize = ({
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
    FFF.firestoreRootPath = firestoreRootPath ? `${firestoreRootPath}/` : '';
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
    }
  };

  public static firestoreRootPath: string;
}
