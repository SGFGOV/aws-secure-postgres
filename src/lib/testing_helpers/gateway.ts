import { TestNumberMap } from "./entities/number-map.entity";

export class Gateway {
    

    constructor() {}

    async createNumberMap(phoneNumber: string, home: string): Promise<TestNumberMap> {
        const map = new TestNumberMap();
        map.phoneNumber = phoneNumber;
        map.home = home;
        return await map.save();
    }

    async getHomeDestination(phoneNumber: string): Promise<string> {
        const map = await TestNumberMap.findOneOrFail({
            where: {
                phoneNumber: phoneNumber
            }
        });

        return map.home;
    }

}