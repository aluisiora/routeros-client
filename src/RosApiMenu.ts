import { RouterOSAPI } from "node-routeros";
import { RosApiOperations } from "./RosApiOperations";
import { RosApiCollection } from "./RosApiCollection";

export class RosApiMenu {

    private rosApi: RouterOSAPI;

    private snakeCase: boolean = false;

    constructor(rosApi: RouterOSAPI) {
        this.rosApi = rosApi;
    }

    public menu(path: string): RosApiOperations {
        return new RosApiOperations(this.rosApi, path, this.snakeCase);
    }
    
    public useSnakeCase(): void {
        this.snakeCase = true;
    }

    public collect(item: any): RosApiCollection | RosApiCollection[] {
        if (Array.isArray(item)) {
            const items: RosApiCollection[] = [];
            for (const i of item) {
                items.push(new RosApiCollection(this.rosApi, i, this.snakeCase));
            }
            return items;
        }
        return new RosApiCollection(this.rosApi, item, this.snakeCase);
    }
}
