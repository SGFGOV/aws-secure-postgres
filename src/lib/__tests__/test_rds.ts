import { Gateway } from "../testing_helpers/gateway";
import { TestHelper } from '../testing_helpers/testhelper';


beforeAll(async () => {
    const dotenv=require ("dotenv").config()
    const RDS_HOST=process.env.RDS_HOST;
    const PORT=process.env.RDS_PORT;
    const USERNAME=process.env.RDS_USERNAME;
    jest.setTimeout(10000) 
    console.log(RDS_HOST,PORT,USERNAME)
    await TestHelper.instance.setupTestDB(USERNAME??"postgres",PORT??"5432",RDS_HOST!);
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