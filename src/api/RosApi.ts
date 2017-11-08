import { RouterOSAPI, IRosOptions, RosException } from "node-routeros";
import { IRosSocket } from "../IRosSocket";
import { RosApiMenu } from "./RosApiMenu";

export class RosAPI implements IRosSocket {

    private api: RouterOSAPI;

    constructor(api: RouterOSAPI) {
        this.api = api;
    }

    public connect(): Promise<RosApiMenu> {
        const apiMenu = this.apiMenu();
        if (this.api.connected) return Promise.resolve(apiMenu);
        return this.api.connect().then(() => {
            return Promise.resolve(apiMenu);
        }).catch((err: RosException) => {
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
