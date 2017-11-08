import { RouterOSAPI } from "node-routeros";
import * as Types from "./Types";

export abstract class RouterOSAPICrud {
    
    protected api: RouterOSAPI;

    protected path: string;

    protected proplistVal: string;

    protected queryVal: string[];

    constructor(api: RouterOSAPI) {
        this.api = api;
    }

    public add(data: object): Types.SocPromise {
        return this.exec("add");
    }
    
    public create(data: object): Types.SocPromise {
        return this.add(data);
    }

    public disable(): Types.SocPromise {
        return this.exec("disable");
    }

    public enable(): Types.SocPromise {
        return this.exec("enable");
    }

    public delete(ids?: Types.Id): Types.SocPromise {
        return this.remove(ids);
    }

    public exec(command: string, data?: object): Types.SocPromise {
        if (data) this.makeQuery(data);
        const query = this.fullQuery("/" + command);
        return this.write(query);
    }

    public move(to: string | number): Types.SocPromise {
        
        return;
    }

    public update(data: object): Types.SocPromise {
        return this.exec("set");
    }

    public unset(properties?: string | string[]): Types.SocPromise {
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

    public set(data: object): Types.SocPromise {
        return this.update(data);
    }

    protected fullQuery(append: string): string[] {
        let val = [this.path + append];
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
                tmpKey = key.replace(/_/, "-");

                // if selecting for id, convert it to .id to match mikrotik standards
                if (tmpKey === "id") tmpKey = ".id";
                if (tmpKey === "nextid") tmpKey = ".nextid";
                if (tmpKey === "dead") tmpKey = ".dead";

                if (tmpVal === true) tmpVal = "yes";
                if (tmpVal === false) tmpVal = "no";
                if (tmpVal === null) tmpVal = "";

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
