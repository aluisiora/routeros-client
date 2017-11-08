import { RouterOSAPI, IRosOptions } from "node-routeros";
import { RosAPI } from "./api/RosApi";

export class RouterOSClient {

    private options: IRosOptions;

    private apiObj: RouterOSAPI;

    constructor(options: IRosOptions) {
        this.options = options;
        this.apiObj = new RouterOSAPI(this.options);
    }

    public api(): RouterOSAPI {
        return this.apiObj;
    }

    public ssh(): void {
        return;
    }

    public snmp(): void {
        return;
    }

    public web(): void {
        return;
    }
}
