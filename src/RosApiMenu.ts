import { RouterOSAPI } from "node-routeros";
import { RosApiOperations } from "./RosApiOperations";
import { RosApiCollection } from "./RosApiCollection";

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
     * and creates collections
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
    public menu(path: string): RosApiOperations {
        return new RosApiOperations(this.rosApi, path, this.snakeCase);
    }
    
    /**
     * Instead of transforming the routeros properties
     * to camelCase, transforms to snake_case
     */
    public useSnakeCase(): void {
        this.snakeCase = true;
    }

    /**
     * Creates a collection of pre-made actions to do
     * with an item from any menu that has lists
     * 
     * @param item The item of a menu (Ex: a single firewall rule, or an IP address)
     */
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
