import admin, {ServiceAccount} from 'firebase-admin';

export class FFF {
  public static initialize = (option?: {
    serviceAccount?: ServiceAccount;
    databaseUrl?: string;
    storageBucketName?: string;
    firestoreRootPath?: string;
    projectId?: string;
  }): void => {
    FFF.firestoreRootPath = option?.firestoreRootPath ? `${option.firestoreRootPath}/` : '';
    if (!admin.apps.length) {
      admin.initializeApp(
        option?.serviceAccount
          ? {
              credential: admin.credential.cert(option.serviceAccount),
              databaseURL: option?.databaseUrl,
              storageBucket: option?.storageBucketName,
              projectId: option?.projectId,
            }
          : option?.projectId
          ? {projectId: option.projectId}
          : undefined
      );
    }
  };

  public static firestoreRootPath: string;
}
