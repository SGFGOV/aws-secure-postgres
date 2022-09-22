
import pg from 'pg';


import * as dotenv from 'dotenv';
dotenv.config();
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {Context} from 'aws-lambda';

// example import local file

export type ExecutorResult ={
  status:number;
  body:string;
}
export type DbInitStatus = {

  
    dbName:string;
    status: number;
    dbUserName?:string;
  
}

export type FinalResult ={
  status:number;
  body:DbInitStatus[];
}

export type DbConfig = { 
  dbName: string; host: string; port: 
        string; dbWebUsername: string; dbCredentialsName?:string
      region?:string}


export class Executor {
  
  constructor() {}


  
  
  

  async execute(
      
      e: {params:{config:DbConfig}},
      context: Context,
  ): Promise<DbInitStatus> {
    let sqlStatement = '';
    let res_statement_1 = {};
    let res_statement_2 = {};
    const {config} = e.params;
    try {
      
      const secretsClient = new SecretsManagerClient({region: config.region});

      const {password, username} = await this.getSecretValue(
          config.dbCredentialsName!,
          secretsClient,
      );
      let connection = new pg.Client({
        host: config.host,
        port: parseInt(config.port,10) || 5432 /* postgres port */,
        user: username,
        password: password,
        database: config.dbName,
        //  multipleStatements: true,
      });
      
      let result_authorisation:DbInitStatus ;
      connection.connect();
      // `CREATE USER " IF NOT EXISTS" ;
      // SQL statement to create a user which uses the AWSAuthenticationPlugin
      // See https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.DBAccounts.html for more info (and Postgres example)
      const userQuery = await connection.query(
          `SELECT FROM pg_roles where rolname = $1`,
          [`${config.dbWebUsername}`],
      );
      if (userQuery.rows.length === 0) {
        // user doesn't exist. make it
        await connection.query(`CREATE USER ${config.dbWebUsername} `);
      }

      sqlStatement = `    GRANT rds_iam TO "${config.dbWebUsername}";
                          GRANT CONNECT ON DATABASE ${config.dbName} TO "${config.dbWebUsername}";
                          GRANT USAGE ON SCHEMA public TO "${config.dbWebUsername}";
                          GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${config.dbWebUsername}";
                          GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${config.dbWebUsername}";
                          GRANT ALL PRIVILEGES ON DATABASE ${config.dbName} TO "${config.dbWebUsername}";
                          ALTER DATABASE  ${config.dbName} OWNER TO  "${config.dbWebUsername}";
                          ALTER SCHEMA  public OWNER TO  "${config.dbWebUsername}";`;

      res_statement_1 = await connection.query(sqlStatement);
      result_authorisation = {
        dbName: `${config.dbName}`,
        dbUserName : `${config.dbWebUsername}`,
        status: 200,
      };

      console.log(JSON.stringify(result_authorisation))
      return result_authorisation;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      //   cfn.send(e, context,cfn.FAILED)
      return {
        dbName: `${config.dbName}`,
        dbUserName : `${config.dbWebUsername}`,
        status: 400,
        }
      };
    }
  

  // eslint-disable-next-line valid-jsdoc
  /**
   * retrieves a secret
   * @param {*} secretId
   * @param {*} secretsClient
   * @returns {secert string}
   */
  async getSecretValue(
      secretId: string,
      secretsClient: SecretsManagerClient,
  ): Promise<any> {
    const command = new GetSecretValueCommand({SecretId: secretId});
    try {
      const data = await secretsClient.send(command);
      return JSON.parse(data.SecretString!);
    } catch (err) {
      return err;
    }
  }
}

export default new Executor();
