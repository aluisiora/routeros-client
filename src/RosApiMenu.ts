import { RouterOSAPI } from "node-routeros";
import { RosApiOperations } from "./RosApiOperations";

export class RosApiMenu {

    private rosApi: RouterOSAPI;

    private snakeCase: boolean = false;

    constructor(rosApi: RouterOSAPI) {
        this.rosApi = rosApi;
    }

    public menu(path: string): RosApiOperations {
        path = path.replace(/(print|enable|disable|add|set|remove|getall|move)$/, "").replace(/\/$/, "");
        return new RosApiOperations(this.rosApi, path, this.snakeCase);
    }
    
    public useSnakeCase(): void {
        this.snakeCase = true;
    }
}
