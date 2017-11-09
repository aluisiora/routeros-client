import { RouterOSAPI, IRosOptions, RosException } from "node-routeros";
import { IRosSocket } from "./IRosSocket";
import { RosApiMenu } from "./RosApiMenu";

export class RouterOSClient implements IRosSocket {

    private options: IRosOptions;

    private api: RouterOSAPI;

    constructor(options: IRosOptions) {
        this.options = options;
        this.api = new RouterOSAPI(this.options);
    }

    public connect(): Promise<RosApiMenu> {
        const apiMenu = this.apiMenu();
        if (this.api.connected) return Promise.resolve(apiMenu);
        return this.api.connect().then(() => {
            return Promise.resolve(apiMenu);
        }).catch((err: Error) => {
            return Promise.reject(err);
        });
    }

    public apiMenu(): RosApiMenu {
        return new RosApiMenu(this.api);
    }

    public disconnect(): Promise<RouterOSAPI> {
        return this.api.close();
    }

    public close(): Promise<RouterOSAPI> {
        return this.disconnect();
    }

    public end(): Promise<RouterOSAPI> {
        return this.disconnect();
    }

}
