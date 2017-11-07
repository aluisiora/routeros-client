import { RouterOSAPI } from "node-routeros";

export abstract class RouterOSAPICrud {
    
    protected api: RouterOSAPI;

    protected path: string;

    protected proplistVal: string;

    protected queryVal: string[];

    constructor(api: RouterOSAPI) {
        this.api = api;
    }

    public add(data: object): Promise<object[]> {
        return this.exec("add");
    }
    
    public create(data: object): Promise<object[]> {
        return this.add(data);
    }

    public disable(): Promise<object[]> {
        return this.exec("disable");
    }

    public enable(): Promise<object[]> {
        return this.exec("enable");
    }

    public delete(ids: string | string[] | number[]): Promise<object[]> {
        return this.remove(ids);
    }

    public exec(command: string, data?: object): Promise<object[]> {
        this.makeQuery(data);
        const query = this.fullQuery("/" + command);
        return this.write(query);
    }

    public move(from: string | string[] | number[], to: string | number): Promise<object[]> {
        return;
    }

    public update(data: object): Promise<object[]> {
        return this.exec("set");
    }

    public unset(): Promise<object[]> {
        return;
    }

    public remove(ids: string | string[] | number[]): Promise<object[]> {
        this.queryVal.push("=numbers=" + ids);
        return this.exec("remove");
    }

    public set(data: object): Promise<object[]> {
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

    protected write(query: string[]): Promise<object[]> {
        this.queryVal = [];
        this.proplistVal = "";
        return this.api.write(query);
    }
}
