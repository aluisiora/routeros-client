import { RouterOSAPI } from "node-routeros";
import { RosApiOperations } from "./RosApiOperations";

export class RosApiMenu {

    private rosApi: RouterOSAPI;

    constructor(rosApi: RouterOSAPI) {
        this.rosApi = rosApi;
    }

    public menu(path: string): RosApiOperations {
        return new RosApiOperations(this.rosApi, path);
    }
}
