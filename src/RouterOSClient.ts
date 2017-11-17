import { RouterOSAPI, IRosOptions, RosException } from "node-routeros";
import { RosApiMenu } from "./RosApiMenu";

export class RouterOSClient {

    /**
     * Options of the connection
     */
    private options: IRosOptions;

    /**
     * The raw API which this class wraps around
     */
    private rosApi: RouterOSAPI;

    /**
     * Creates a client with the options provided,
     * so you are able to connect and input actions
     * 
     * @param options Connection options
     */
    constructor(options: IRosOptions) {
        this.options = options;
        this.rosApi = new RouterOSAPI(this.options);
    }

    /**
     * Connects to the routerboard with the options provided
     */
    public connect(): Promise<RosApiMenu> {
        const api = this.api();
        if (this.rosApi.connected) return Promise.resolve(api);
        return this.rosApi.connect().then(() => {
            return Promise.resolve(api);
        }).catch((err: Error) => {
            return Promise.reject(err);
        });
    }

    /**
     * Get an instance of the API to handle operations
     */
    public api(): RosApiMenu {
        return new RosApiMenu(this.rosApi);
    }

    /**
     * Disconnect of the routerboard
     */
    public disconnect(): Promise<RouterOSAPI> {
        return this.rosApi.close();
    }

    /**
     * Alias to disconnect
     */
    public close(): Promise<RouterOSAPI> {
        return this.disconnect();
    }

    /**
     * Alias to disconnect
     */
    public end(): Promise<RouterOSAPI> {
        return this.disconnect();
    }

}
