import { RouterOSAPI } from "node-routeros";
import { IRouterOSAPICrud } from "./IRosApiCrud";

export class RosApiOperations implements IRouterOSAPICrud {

    private api: RouterOSAPI;

    private path: string;

    constructor(api: RouterOSAPI, path: string) {
        this.api = api;
        this.path = path;
    }

    public select(): void {
        return;
    }

    public only(): void {
        return;
    }

    public proplist(): void {
        return;
    }

    public where(): void {
        return;
    }

    public query(): void {
        return;
    }

    public filter(): void {
        return;
    }

    public get(): void {
        return;
    }

    public getAll(): void {
        return;
    }

    public print(): void {
        return;
    }

    public find(): void {
        return;
    }

    public getOne(): void {
        return;
    }

    public getOnly(): void {
        return;
    }

    public exec(): void {
        return;
    }

    public set(): void {
        return;
    }

    public update(): void {
        return;
    }

    public unset(): void {
        return;
    }

    public delete(): void {
        return;
    }

    public remove(): void {
        return;
    }
}
