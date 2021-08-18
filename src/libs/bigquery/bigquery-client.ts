import {BigQuery} from '@google-cloud/bigquery';
import {HttpError, HttpStatusCode} from '../../api/http-error';
import {Logger} from '../../logger/logger';
import {chunk} from '../../utils/utils';

const logger = Logger.create('BigQueryClient');

const MAXIMUM_EXECUTION_AMOUNT_YEN = 5;

export class BigQueryClient {
  private client: BigQuery;
  constructor(credentials?: {projectId: string; private_key: string; client_email: string}) {
    this.client = new BigQuery(
      credentials
        ? {
            projectId: credentials?.projectId,
            credentials,
          }
        : undefined
    );
  }

  public stremingInsert = async (datasetId: string, tableId: string, values: {insertId?: string; data: any}[]) => {
    const insertRows = values
      .map(value => ({
        insertId: value.insertId,
        json: value.data,
      }))
      .map(deepDeleteUndefined);

    if (!insertRows.length) {
      logger.log('no data.');
      return;
    }

    for (const rows of chunk(insertRows, 1000)) {
      await this.client
        .dataset(datasetId)
        .table(tableId)
        .insert(rows, {raw: true})
        .catch(e => {
          if (e.errors?.length) {
            e.errors.forEach((error: any) => {
              logger.log('bigquery error', error);
            });
          }
        });
      logger.log(`insert to bigquery. tableId: ${datasetId}.${tableId} count: ${rows.length} / ${insertRows.length}`);
    }
    logger.log(`insert process completed. tableId: ${datasetId}.${tableId} count: ${insertRows.length}`);
  };

  /**
   * @param sql
   * @param params
   */
  public executeQuery = async <T>(sql: string, params?: {[param: string]: any}): Promise<T[]> => {
    const [, res] = await this.client.createQueryJob({query: sql, dryRun: true});
    const yen = this.billedAsYen(res.statistics?.totalBytesProcessed);
    logger.log('見積もり(円):', yen);

    // 見積もり失敗か5円以上かかるならエラー
    if (!yen || yen > MAXIMUM_EXECUTION_AMOUNT_YEN) {
      throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'query-cost-is-too-high');
    }

    const result = await this.client.query({query: sql, params}).catch(e => {
      logger.error('failed to execute query', e);
      throw new HttpError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'failed-to-execute-query');
    });

    return result[0] as T[];
  };

  private billedAsYen = (bytesProcessed?: string | number) => {
    if (!bytesProcessed) return;
    const minBytesBilled: number = 1024 * 1024 * 10;
    const bytes: number = minBytesBilled > Number(bytesProcessed) ? minBytesBilled : Number(bytesProcessed);
    const bytesAsTeraBytes: number = bytes / 1024 / 1024 / 1024 / 1024;
    return (bytesAsTeraBytes / 1) /* TB */ * 5 /* $ */ * 113; /* 円(ドル円相場) */
  };
}
function deepDeleteUndefined(deepDeleteUndefined: any): any {
  throw new Error('Function not implemented.');
}
