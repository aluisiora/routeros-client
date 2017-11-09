import { RouterOSAPI } from "node-routeros";
import { RosApiOperations } from "./RosApiOperations";

export class RosApiMenu {

    private api: RouterOSAPI;

    constructor(api: RouterOSAPI) {
        this.api = api;
    }

    public menu(path: string): RosApiOperations {
        return new RosApiOperations(this.api, path);
    }
}
