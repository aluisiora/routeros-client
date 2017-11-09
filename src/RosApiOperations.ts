import { RouterOSAPI, RosException, Stream } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";
import { RosApiCollection } from "./RosApiCollection";

export class RosApiOperations extends RouterOSAPICrud {

    constructor(rosApi: RouterOSAPI, path: string, snakeCase: boolean) {
        super(rosApi, path, snakeCase);
    }

    public select(fields: string | string[]): RosApiOperations {
        let commaFields: string = "=.proplist=";
        if (typeof fields === "string") fields = [fields];
        
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (/id|dead|nextid/.test(field)) fields[i] = "." + field;
        }

        // Convert array to a string comma separated 
        commaFields += fields;
        this.proplistVal = commaFields;
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
        this.makeQuery(search);
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

    public orWhere(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#|");
        return this;
    }

    public orWhereNot(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!", "?#|");
        return this;
    }

    public andWhere(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#&");
        return this;
    }

    public andWhereNot(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!", "?#&");
        return this;
    }

    public whereNot(key: object | string, value?: string): RosApiOperations {
        this.where(key, value);
        this.queryVal.push("?#!");
        return this;
    }

    public whereHigher(key: object | string, value?: string): RosApiOperations {
        this.where(">" + key, value);
        return this;
    }

    public whereLower(key: object | string, value?: string): RosApiOperations {
        this.where(">" + key, value);
        return this;
    }

    public whereExists(key: string): RosApiOperations {
        return this.whereHigher(key);
    }

    public whereNotEmpty(key: string): RosApiOperations {
        return this.whereHigher(key);
    }

    public whereEmpty(key: string): RosApiOperations {
        this.where("-" + key);
        return this;
    }

    public whereNotExists(key: string): RosApiOperations {
        return this.whereEmpty(key);
    }

    public get(data?: object): Promise<object[]> {
        if (data) this.makeQuery(data);
        const query = this.fullQuery("/print", true);
        return this.write(query);
    }

    public getAll(data?: object): Promise<object[]> {
        return this.get(data);
    }

    public getCollection(data?: object): Promise<object[]> {
        return this.get(data).then((results) => {
            for (let i = 0; i < results.length; i++) {
                results[i] = new RosApiCollection(this.rosApi, results[i], this.snakeCase);
            }
            return Promise.resolve(results);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
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

    /**
     * Remove all entries of the current menu
     */
    public purge(): Promise<object> {
        return this.write([
            this.pathVal + "/print",
            "=.proplist=.id"
        ]).then((results) => {
            const ids = [];
            results.forEach((result) => {
                ids.push(result[".id"]);
            });
            return this.write([
                this.pathVal + "/remove",
                "=numbers=" + ids
            ]);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public stream(callback?: () => void): Stream {
        const query = this.fullQuery();
        return this.rosApi.stream(query, callback);
    }
    
}
