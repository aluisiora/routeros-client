import { RouterOSAPI } from "node-routeros";
import { IRouterOSAPICrud } from "./IRosApiCrud";

export class RosApiOperations implements IRouterOSAPICrud {

    private api: RouterOSAPI;

    private path: string;

    private proplistVal: string;

    constructor(api: RouterOSAPI, path: string) {
        this.api = api;
        this.path = path.replace(/ /g, "/");
    }

    public select(fields: string | string[]): RosApiOperations {
        let commaFields: string = ".proplist=";
        if (Array.isArray(fields)) {
            for (const key in fields) {
                if (fields.hasOwnProperty(key)) {
                    if (fields[key] === "id") fields[key] = ".id";
                }
            }
            // Convert array to string comma separated and clean any space left
            commaFields += ("" + fields).replace(/ /g, "");
        } else {
            commaFields += fields;
        }
        // Replace any underline to hiphen if used
        this.proplistVal = commaFields.replace(/_/g, "-");
        
        return this;
    }

    /**
     * Alias for select()
     * @param fields
     */
    public only(fields: string | string[]): RosApiOperations {
        return this.select(fields);
    }

    /**
     * Alias for select()
     * @param fields 
     */
    public proplist(fields: string | string[]): RosApiOperations {
        return this.select(fields);
    }

    public where(key: object | string, value?: string): RosApiOperations {
        let search: object = {};
        if (typeof key === "string") {
            search[key] = value || "";
        } else {
            search = key;
        }
        return this.makeQuery(search);
    }

    public orWhere(): RosApiOperations {
        return this;
    }

    public andWhere(): RosApiOperations {
        return this;
    }

    public notWhere(): RosApiOperations {
        return this;
    }

    public query(): RosApiOperations {
        return this;
    }

    public filter(): RosApiOperations {
        return this;
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

    private makeQuery(searchParameters: object, addQuote: boolean = false): RosApiOperations {
        return this;
    }
}
