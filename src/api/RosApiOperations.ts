import { RouterOSAPI, RosException } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";

export class RosApiOperations extends RouterOSAPICrud {

    constructor(api: RouterOSAPI, path: string) {
        super(api);
        this.path = path.replace(/ /g, "/");
    }

    public select(fields: string | string[]): RosApiOperations {
        let commaFields: string = ".proplist=";
        if (typeof fields === "string") {
            commaFields += fields;
        } else {
            // Convert array to a string comma separated and clean any space left
            commaFields += ("" + fields).replace(/ /g, "");
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

    public where(key: object | string, value: string = ""): RosApiOperations {
        let search: object = new Object();
        if (typeof key === "string") {
            search[key] = value;
        } else {
            search = key;
        }
        this.makeQuery(search, true);
        return this;
    }

    public query(key: object | string, value?: string): RosApiOperations {
        return this.where(key, value);
    }

    public filter(key: object | string, value?: string): RosApiOperations {
        return this.where(key, value);
    }

    public whereRaw(search: string[]): RosApiOperations {
        this.queryVal = this.queryVal.concat(search);
        return this;
    }

    public orWhere(key: string, value: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#|");
        return this;
    }

    public orWhereNot(key: string, value: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!", "?#|");
        return this;
    }

    public andWhere(key: string, value: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#&");
        return this;
    }

    public andWhereNot(key: string, value: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!", "?#&");
        return this;
    }

    public whereNot(key: string, value: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!");
        return this;
    }

    public get(data?: object): Promise<object[]> {
        if (data) this.makeQuery(data);
        const query = this.fullQuery("/print");
        return this.write(query);
    }

    public getAll(data?: object): Promise<object[]> {
        return this.get(data);
    }

    public print(data?: object): Promise<object[]> {
        return this.get(data);
    }

    public find(data?: object): Promise<object> {
        return this.get(data).then((results) => {
            let result: object = new Object();
            if (results.length > 0) result = results[0];
            return Promise.resolve(result);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public getOne(data?: object): Promise<object> {
        return this.find(data);
    }

    public getOnly(data?: object): Promise<object> {
        return this.find(data);
    }

    public exec(): Promise<object[]> {
        return;
    }
    
}
