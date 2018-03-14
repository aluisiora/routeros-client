import { RouterOSAPI, IRosOptions, RosException } from "node-routeros";
import { RosApiMenu } from "./RosApiMenu";
import { EventEmitter } from "events";

export class RouterOSClient extends EventEmitter {

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
        super();
        this.options = options;
        this.rosApi = new RouterOSAPI(this.options);
    }

    /**
     * If it is connected or not
     */
    public isConnected(): boolean {
        return this.rosApi.connected;
    }

    /**
     * Connects to the routerboard with the options provided
     */
    public connect(): Promise<RosApiMenu> {
        const api = this.api();
        if (this.rosApi.connected) return Promise.resolve(api);
        return this.rosApi.connect().then(() => {
            this.emit("connected", api);
            this.rosApi.once("error", (err: RosException) => this.emit("error", err));
            this.rosApi.once("close", () => this.emit("close"));
            return Promise.resolve(api);
        }).catch((err: Error) => {
            this.emit("error", err);
            return Promise.reject(err);
        });
    }

    /**
     * Change current connection options
     * but it doesn't reconnect
     * 
     * @param options Connection options
     */
    public setOptions(options: any): RouterOSClient {
        Object.assign(this.options, options);
        this.rosApi.setOptions(this.options);
        return this;
    }

    /**
     * Get an instance of the API to handle operations
     */
    public api(): RosApiMenu {
        return new RosApiMenu(this.rosApi);
    }

    /**
     * Disconnect from the routerboard
     */
    public disconnect(): Promise<RouterOSClient> {
        return this.rosApi.close().then((api) => {
            this.emit("disconnected", this);
            return Promise.resolve(this);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Alias to disconnect
     */
    public close(): Promise<RouterOSClient> {
        return this.disconnect();
    }

    /**
     * Alias to disconnect
     */
    public end(): Promise<RouterOSClient> {
        return this.disconnect();
    }

    /**
     * Return the options provided
     */
    public getOptions(): IRosOptions {
        return this.options;
    }

}
