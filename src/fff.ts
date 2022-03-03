import admin, {ServiceAccount} from 'firebase-admin';

export class FFF {
  public static initializeTest = (option?: {firestoreRootPath?: string}) => {
    FFF.firestoreRootPath = option?.firestoreRootPath ? `${option.firestoreRootPath}/` : '';
    admin.initializeApp({projectId: 'test'});
  };

  public static initialize = (
    option?: {
      serviceAccount?: ServiceAccount;
      databaseUrl?: string;
      storageBucketName?: string;
      firestoreRootPath?: string;
      projectId?: string;
      verifyDomain?: string;
    },
    isTest = false
  ): void => {
    FFF.firestoreRootPath = option?.firestoreRootPath ? `${option.firestoreRootPath}/` : '';
    FFF.verifyDomain = option?.verifyDomain || '';
    if (!admin.apps.length) {
      isTest
        ? admin.initializeApp({projectId: 'test'})
        : admin.initializeApp(
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
  public static verifyDomain: string;
}
