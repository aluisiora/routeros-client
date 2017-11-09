import { RouterOSAPI, IRosOptions, RosException } from "node-routeros";
import { RosApiMenu } from "./RosApiMenu";

export class RouterOSClient {

    private options: IRosOptions;

    private rosApi: RouterOSAPI;

    constructor(options: IRosOptions) {
        this.options = options;
        this.rosApi = new RouterOSAPI(this.options);
    }

    public connect(): Promise<RosApiMenu> {
        const api = this.api();
        if (this.rosApi.connected) return Promise.resolve(api);
        return this.rosApi.connect().then(() => {
            return Promise.resolve(api);
        }).catch((err: Error) => {
            return Promise.reject(err);
        });
    }

    public api(): RosApiMenu {
        return new RosApiMenu(this.rosApi);
    }

    public disconnect(): Promise<RouterOSAPI> {
        return this.rosApi.close();
    }

    public close(): Promise<RouterOSAPI> {
        return this.disconnect();
    }

    public end(): Promise<RouterOSAPI> {
        return this.disconnect();
    }

}
