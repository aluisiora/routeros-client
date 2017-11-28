import { RouterOSAPI } from "node-routeros";
import { RosApiCommands } from "./RosApiCommands";
import { RosApiModel } from "./RosApiModel";

export class RosApiMenu {

    /**
     * The raw API
     */
    private rosApi: RouterOSAPI;

    /**
     * Toggles snake_case mode, defaults to camelCase
     */
    private snakeCase: boolean = false;

    /**
     * Creates a handler for the menus
     * and creates Models
     * 
     * @param rosApi The raw api
     */
    constructor(rosApi: RouterOSAPI) {
        this.rosApi = rosApi;
    }

    /**
     * Returns a set of operations to do over
     * the menu provided
     * 
     * @param path The menu you want to do actions
     */
    public menu(path: string): RosApiCommands {
        return new RosApiCommands(this.rosApi, path, this.snakeCase);
    }
    
    /**
     * Instead of transforming the routeros properties
     * to camelCase, transforms to snake_case
     */
    public useSnakeCase(): void {
        this.snakeCase = true;
    }

    /**
     * Creates a model of pre-made actions to do
     * with an item from any menu that has lists
     * 
     * @param item The item of a menu (Ex: a single firewall rule, or an IP address)
     */
    public model(item: any): RosApiModel | RosApiModel[] {
        if (Array.isArray(item)) {
            const items: RosApiModel[] = [];
            for (const i of item) {
                items.push(new RosApiModel(this.rosApi, i, this.snakeCase));
            }
            return items;
        }
        return new RosApiModel(this.rosApi, item, this.snakeCase);
    }
}
