import SecretManager from '@google-cloud/secret-manager';

export class SecretManagerClient {
  private static project: string = '685590396256';
  public static setProject = (id: string) => {
    SecretManagerClient.project = id;
  };

  public static getSecret = async (name: string = 'test-secret'): Promise<string | undefined> => {
    const client = new SecretManager.SecretManagerServiceClient();
    const [secret] = await client.accessSecretVersion({
      name: `projects/${SecretManagerClient.project}/secrets/${name}/versions/latest`,
    });

    const responsePayload = secret.payload?.data?.toString();
    return responsePayload;
  };
}
