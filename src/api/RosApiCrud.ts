import { RouterOSAPI } from "node-routeros";
import * as Types from "./Types";

export abstract class RouterOSAPICrud {
    
    protected api: RouterOSAPI;

    protected path: string;

    protected proplistVal: string;

    protected queryVal: string[];

    constructor(api: RouterOSAPI, path: string) {
        this.api = api;
        this.path = path.replace(/ /g, "/");
    }

    public add(data: object): Types.SocPromise {
        return this.exec("add");
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

    protected fullQuery(append?: string): string[] {
        let val = [];
        if (append) {
            val.push(this.path + append);
        } else {
            val.push(this.path);
        }
        if (this.proplistVal) val.push(this.proplistVal);
        return val = val.concat(this.queryVal).slice();
    }    

    /**
     * Make the query array to write on the API
     * @param searchParameters The key-value pair to add to the search
     * @param addQuote If it is going to use a ? or = operator
     */
    protected makeQuery(searchParameters: object, addQuote: boolean = false): string[] {
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

                switch (tmpVal) {
                    case true:
                        tmpVal = "yes";
                        break;

                    case false:
                        tmpVal = "no";
                        break;

                    case null:
                        tmpVal = "";
                        break;
                
                    default:
                        break;
                }

                tmpVal = (addQuote ? "?" : "=") + tmpVal;

                this.queryVal.push(tmpKey + "=" + tmpVal);
            }
        }

        return this.queryVal;
    }

    protected write(query: string[]): Types.SocPromise {
        this.queryVal = [];
        this.proplistVal = "";
        return this.api.write(query);
    }
}
