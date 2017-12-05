import { RouterOSAPI, RosException } from "node-routeros";
import * as Types from "./Types";

export abstract class RouterOSAPICrud {
    
    protected rosApi: RouterOSAPI;

    protected pathVal: string;

    protected proplistVal: string;

    protected queryVal: string[] = [];

    protected snakeCase: boolean;

    /**
     * Creates a CRUD set of operations and handle
     * the raw query to input on the raw API
     * 
     * @param rosApi the raw api
     * @param path the menu path we are in
     * @param snakeCase if should return routerboard properties in snake_case, defaults to camelCase
     */
    constructor(rosApi: RouterOSAPI, path: string, snakeCase: boolean) {
        this.rosApi = rosApi;
        this.snakeCase = snakeCase;
        this.pathVal = path
            .replace(/ /g, "/")
            .replace(/(print|enable|disable|add|set|remove|getall|move)$/, "")
            .replace(/\/$/, "");
    }

    /**
     * Adds an item on the menu
     * 
     * @param data the params that will be used to add the item
     */
    public add(data: object): Types.SocPromise {
        return this.exec("add", data).then((results: any) => {
            if (results.length > 0) results = results[0];
            return Promise.resolve(results);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }
    
    /**
     * Alias of add
     * 
     * @param data the params that will be used to add the item
     */
    public create(data: object): Types.SocPromise {
        return this.add(data);
    }

    /**
     * Disable one or more entries
     * 
     * @param ids the id(s) or number(s) to disable
     */
    public disable(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.exec("disable");
    }
    
    /**
     * Delete one or more entries
     * 
     * @param ids the id(s) or number(s) to delete
     */
    public delete(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.remove(ids);
    }

    /**
     * Enable one or more entries
     * 
     * @param ids the id(s) or number(s) to enable
     */
    public enable(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.exec("enable");
    }
    
    /**
     * Run a custom command over the api, for example "export"
     * 
     * @param command the command to run
     * @param data optional data that goes with the command
     */
    public exec(command: string, data?: object): Types.SocPromise {
        if (data) this.makeQuery(data);
        const query = this.fullQuery("/" + command);
        return this.write(query);
    }

    /**
     * Moves a rule ABOVE the destination
     * 
     * @param from the rule you want to move
     * @param to the destination where you want to move
     */
    public move(from: Types.Id, to?: string | number): Types.SocPromise {
        if (!Array.isArray(from)) from = [from];
        this.queryVal.push("=numbers=" + from);
        if (to) this.queryVal.push("=destination=" + to);
        return this.exec("move");
    }

    /**
     * Update an entry or set of entries of the menu
     * 
     * @param data the new data to update the item
     * @param ids optional id(s) of the rules
     */
    public update(data: object, ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        this.makeQuery(data);
        return this.exec("set");
    }

    /**
     * Unset a property or set of properties of one or more entries
     * 
     * @param properties one or more properties to unset
     * @param ids the id(s) of the entries to unset the property(ies)
     */
    public unset(properties: string | string[], ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        if (typeof properties === "string") properties = [properties];
        const $q: Types.SocPromise[] = [];
        const curQueryVal = this.queryVal.slice();
        this.queryVal = [];
        properties.forEach((property) => {
            this.queryVal = curQueryVal.slice();
            this.queryVal.push("=value-name=" + this.camelCaseOrSnakeCaseToDashedCase(property));
            $q.push(this.exec("unset"));
        });
        return Promise.all($q);
    }

    /**
     * Removes an entry or set of entries of the menu
     * 
     * @param ids optional id(s) to be removed from the menu
     */
    public remove(ids?: Types.Id): Types.SocPromise {
        if (ids) this.queryVal.push("=numbers=" + ids);
        return this.exec("remove");
    }

    /**
     * Alias of update
     * 
     * @param data the new data to update the item
     * @param ids optional id(s) of the rules
     */
    public set(data: object, ids?: Types.Id): Types.SocPromise {
        return this.update(data, ids);
    }

    /**
     * Alias of update
     * 
     * @param data the new data to update the item
     * @param ids optional id(s) of the rules
     */
    public edit(data: object, ids?: Types.Id): Types.SocPromise {
        return this.update(data, ids);
    }

    /**
     * Creates the full array of sentences that will be
     * compatible with the raw API to be sent to the
     * routerboard using all the functions triggered
     * up until now
     * 
     * @param append action to add in front of the menu
     */
    protected fullQuery(append?: string): string[] {
        let val = [];
        if (append) {
            val.push(this.pathVal + append);
        } else {
            val.push(this.pathVal);
        }
        if (this.proplistVal) val.push(this.proplistVal);
        val = val.concat(this.queryVal).slice();

        if (!/(print|getall)$/.test(val[0])) {
            for (let index = 0; index < val.length; index++) {
                val[index] = val[index].replace(/^\?/, "=");
            }
        }

        return val;
    }    

    /**
     * Make the query array to write on the API,
     * adding a question mark if it needs to print
     * filtered content
     * 
     * @param searchParameters The key-value pair to add to the search
     */
    protected makeQuery(searchParameters: object, addQuestionMark: boolean = false): string[] {
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

                if (typeof tmpVal === "boolean") {
                    tmpVal = tmpVal ? "yes" : "no";
                } else if (tmpVal === null) {
                    tmpVal = "";
                }

                tmpKey = (addQuestionMark ? "?" : "=") + tmpKey;

                tmpKey = this.camelCaseOrSnakeCaseToDashedCase(tmpKey);

                this.queryVal.push(tmpKey + "=" + tmpVal);
            }
        }

        return this.queryVal;
    }

    /**
     * Write the query using the raw API
     * 
     * @param query the raw array of sentences to write on the socket
     */
    protected write(query: string[]): Types.SocPromise {
        this.queryVal = [];
        this.proplistVal = "";
        return this.rosApi.write(query).then((results) => {
            return Promise.resolve(this.treatMikrotikProperties(results));
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Transform camelCase or snake_case to dashed-case,
     * so the routerboard can understand the parameters used
     * on this wrapper
     * 
     * @param val to string to transform
     */
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

    /**
     * Transform routerboard's dashed-case to camelCase
     * so we can use objects properties without having to wrap
     * around quotes
     * 
     * @param val the string to transform
     */
    private dashedCaseToCamelCase(val: string): string {
        return val.replace(/-([a-z])/g, (g) => {
            return g[1].toUpperCase();
        });
    }

    /**
     * Transform routerboard's dashed-case to snake_case
     * so we can use objects properties without having to wrap
     * around quotes
     * 
     * @param val the string to transform
     */
    private dashedCaseToSnakeCase(val: string): string {
        return val.replace(/-/g, "_");
    }

    /**
     * Transform mikrotik properties to either camelCase or snake_case
     * and casts values of true or false to boolean and
     * integer strings to number
     * 
     * @param results the result set of an operation
     */
    private treatMikrotikProperties(results: object[]): object[] {
        const treatedArr: object[] = [];
        results.forEach((result) => {
            const tmpItem = {
                $$path : this.pathVal
            };
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
                    } else if (/^\d+(\.\d+)?$/.test(tmpVal)) {
                        tmpItem[tmpKey] = parseFloat(tmpVal);
                    }
                }
            }
            treatedArr.push(tmpItem);
        });
        return treatedArr;
    }
}
