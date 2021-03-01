import admin, {ServiceAccount} from 'firebase-admin';

export class Firebase {
  public static init = ({
    serviceAccount,
    databaseUrl,
    storageBucketName,
  }: {
    serviceAccount: ServiceAccount;
    databaseUrl?: string;
    storageBucketName?: string;
  }): void => {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseUrl,
        storageBucket: storageBucketName,
      });
    }
  };
}
