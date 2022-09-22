import {Connection, createConnection, DataSource } from 'typeorm';
import pg from 'pg';
import path from "path"
import {
    SecretsManagerClient,
    GetSecretValueCommand,
  } from '@aws-sdk/client-secrets-manager';
import * as secure_rds from '../secure-rds-lib';


export class TestHelper {

  private static _instance: TestHelper;;
  dbConnect: DataSource | undefined;

    private constructor() {
      
    }

    public static get instance(): TestHelper {
        if(!this._instance) this._instance = new TestHelper();

        return this._instance;
    }

    
 //   private testdb!: any;


    async setupTestDB(username:string,port:string,host:string) {
        const secretsClient = new SecretsManagerClient({region: "ap-south-1"});
        
        secure_rds.config(
            {
            host,
            port: parseInt(port,10) || 5432 /* postgres port */,
            aws_region: process.env.RDS_REGION??"ap-south-1",
            username,
            }
        )
        this.dbConnect =  new DataSource({
          type: "postgres",
          host: secure_rds.awsConfig.host,
          port: 5432,
          username: secure_rds.awsConfig.username,
          password: secure_rds.getToken,
          database: "postgres",
          synchronize:true,
          entities:[path.join(__dirname, './entities/*.entity.ts')],
          migrationsRun:true,
           ssl:
            {
                ca: await secure_rds.getCertificate()
            }
            //  multipleStatements: true,
          });

        await this.dbConnect.initialize()
         
         
          
    }
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

    teardownTestDB() {
        this.dbConnect?.destroy();
     //   this.testdb.close();
    }

}