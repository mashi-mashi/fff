import admin, {ServiceAccount} from 'firebase-admin';

export class FFF {
  public static initialize = (option?: {
    serviceAccount?: ServiceAccount;
    databaseUrl?: string;
    storageBucketName?: string;
    firestoreRootPath?: string;
    projectId?: string;
    verifyDomain?: string;
  }): void => {
    FFF.firestoreRootPath = option?.firestoreRootPath ? `${option.firestoreRootPath}/` : '';
    FFF.verifyDomain = option?.verifyDomain || '';
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
  public static verifyDomain: string;
}

const data = {
  map: {
    '58b2ba46-4833-6a80-3499-f4f4cb7d7c76': [],
    'b8783019-46cd-54a6-6d96-ae5835c7b84e': [],
    'fdcf8824-e9d2-6bdd-53d4-4536d792a76e': [],
  },
};
