import { Gateway } from "../testing_helpers/gateway";
import { TestHelper } from '../testing_helpers/testhelper';
import {jest,beforeAll,afterAll,describe,test,expect} from '@jest/globals'

beforeAll(async () => {
    const dotenv=require ("dotenv").config()
    const RDS_HOST=process.env.RDS_HOST;
    const PORT=process.env.RDS_PORT;
    const USERNAME=process.env.RDS_USERNAME;
    const DB_NAME = process.env.RDS_DBNAME??"postgres";
    jest.setTimeout(10000) 
    console.log(RDS_HOST,PORT,USERNAME)
    try {
    await TestHelper.instance.setupTestDB(USERNAME??"postgres",PORT??"5432",RDS_HOST!,DB_NAME!);
    }
    catch(err){
        const error = err as Error;
        console.log("unable to setup ",error.message)
    }

});

afterAll(() => {
    TestHelper.instance.teardownTestDB();
});

describe('Gateway Tests', () => {

    test('should create a numbers map', async () => {
        const numbersMap = await new Gateway().createNumberMap('12345678', 'test');
        expect(numbersMap.phoneNumber).toBe('12345678');
        expect(numbersMap.home).toBe('test');
    });

    test('it should be able to return the home destination', async () => {
        const home = await new Gateway().getHomeDestination('12345678');
        expect(home).toBe('test');
    });
});