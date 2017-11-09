import { RouterOSAPI, RosException } from "node-routeros";
import * as Types from "./Types";

export abstract class RouterOSAPICrud {
    
    protected rosApi: RouterOSAPI;

    protected pathVal: string;

    protected proplistVal: string;

    protected queryVal: string[] = [];

    protected snakeCase: boolean;

    constructor(rosApi: RouterOSAPI, path: string, snakeCase: boolean) {
        this.rosApi = rosApi;
        this.snakeCase = snakeCase;
        this.pathVal = path.replace(/ /g, "/");
    }

    public add(data: object): Types.SocPromise {
        return this.exec("add", data).then((results: any) => {
            if (results.length > 0) results = results[0];
            return Promise.resolve(results);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }
    
    public create(data: object): Types.SocPromise {
        return this.add(data);
    }

    public disable(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.exec("disable");
    }
    
    public delete(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.remove(ids);
    }

    public enable(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.exec("enable");
    }
    
    public exec(command: string, data?: object): Types.SocPromise {
        if (data) this.makeQuery(data);
        const query = this.fullQuery("/" + command);
        return this.write(query);
    }

    public move(from: Types.Id, to?: string | number): Types.SocPromise {
        if (!Array.isArray(from)) from = [from];
        this.queryVal.push("=numbers=" + from);
        if (to) this.queryVal.push("=destination=" + to);
        return this.exec("move");
    }

    public update(data: object, ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        this.makeQuery(data);
        return this.exec("set");
    }

    public unset(properties: string | string[], ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        if (typeof properties === "string") properties = [properties];
        const $q: Types.SocPromise[] = [];
        const curQueryVal = this.queryVal.slice();
        this.queryVal = [];
        properties.forEach((property) => {
            this.queryVal = curQueryVal.slice();
            this.queryVal.push("=value-name=" + property);
            $q.push(this.exec("unset"));
        });
        return Promise.all($q);
    }

    public remove(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.exec("remove");
    }

    public set(data: object, ids?: Types.Id): Types.SocPromise {
        return this.update(data, ids);
    }

    protected fullQuery(append?: string, convertToQuote: boolean = false): string[] {
        let val = [];
        if (append) {
            val.push(this.pathVal + append);
        } else {
            val.push(this.pathVal);
        }
        if (this.proplistVal) val.push(this.proplistVal);
        val = val.concat(this.queryVal).slice();
        for (let i = 0; i < val.length; i++) {
            val[i] = this.camelCaseOrSnakeCaseToDashedCase(val[i]);
            if (convertToQuote) val[i] = val[i].replace(/^=/, "?");
        }
        return val;
    }    

    /**
     * Make the query array to write on the API
     * @param searchParameters The key-value pair to add to the search
     */
    protected makeQuery(searchParameters: object): string[] {
        let tmpKey: string;
        let tmpVal: string | number | boolean | null;

        for (const key in searchParameters) {
            if (searchParameters.hasOwnProperty(key)) {
                tmpVal = searchParameters[key];
                if (/[A-Z]/.test(tmpKey)) {
                    tmpKey = tmpKey.replace(/([A-Z])/g, "$1").toLowerCase();
                }
                tmpKey = key.replace(/_/, "-");

                // if selecting for id, convert it to .id to match mikrotik standards
                switch (tmpKey) {
                    case "id":
                        tmpKey = ".id";
                        break;

                    case "next":
                        tmpKey = ".nextid";
                        break;

                    case "dead":
                        tmpKey = ".dead";
                        break;

                    default: 
                        break;
                }

                // tmpKey = (addQuote ? "?" : "=") + tmpKey;

                this.queryVal.push("=" + tmpKey + "=" + tmpVal);
            }
        }

        return this.queryVal;
    }

    protected write(query: string[]): Types.SocPromise {
        this.queryVal = [];
        this.proplistVal = "";
        return this.rosApi.write(query).then((results) => {
            return Promise.resolve(this.treatMikrotikProperties(results));
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    private camelCaseOrSnakeCaseToDashedCase(val: string): string {
        // Clean any empty space left
        return val.replace(/ /g, "")
            // Convert camelCase to dashed
            .replace(/([a-z][A-Z])/g, (g, w) => {
                return g[0] + "-" + g[1].toLowerCase();
            })
            // Replace any underline to hiphen if used
            .replace(/_/g, "-");
    }

    private dashedCaseToCamelCase(val: string): string {
        return val.replace(/-([a-z])/g, (g) => {
            return g[1].toUpperCase();
        });
    }

    private dashedCaseToSnakeCase(val: string): string {
        return val.replace(/-/g, "_");
    }

    private treatMikrotikProperties(results: object[]): object[] {
        const treatedArr: object[] = [];
        results.forEach((result) => {
            const tmpItem = new Object();
            for (const key in result) {
                if (result.hasOwnProperty(key)) {
                    const tmpVal = result[key];
                    let tmpKey = this.snakeCase 
                        ? this.dashedCaseToSnakeCase(key) 
                        : this.dashedCaseToCamelCase(key);
                    tmpKey = tmpKey.replace(/^\./, "");
                    tmpItem[tmpKey] = tmpVal;
                    if (tmpVal === "true" || tmpVal === "false") {
                        tmpItem[tmpKey] = tmpVal === "true";
                    } else if (/^\d+$/.test(tmpVal)) {
                        tmpItem[tmpKey] = parseInt(tmpVal, null);
                    }
                }
            }
            treatedArr.push(tmpItem);
        });
        return treatedArr;
    }
}
