import admin, {ServiceAccount} from 'firebase-admin';

export class Firebase {
  public static init = (serviceAccount: ServiceAccount, databaseUrl: string, storageBucketName: string) => {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseUrl,
      storageBucket: storageBucketName,
    });
  };
}
