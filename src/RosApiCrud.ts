import { RouterOSAPI, RosException } from "node-routeros";
import { flatten, reduce } from "lodash";
import * as utils from "./utils";
import * as Types from "./Types";

export abstract class RouterOSAPICrud {
    
    protected rosApi: RouterOSAPI;

    protected pathVal: string;

    protected proplistVal: string;

    protected queryVal: string[] = [];

    protected snakeCase: boolean;

    private needsObjectTranslation: boolean = false;

    private placeAfter: any;

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
     * Get the current menu
     */
    public getCurrentMenu(): string {
        return this.pathVal;
    }

    /**
     * Adds an item on the menu
     * 
     * @param data the params that will be used to add the item
     */
    public add(data: object): Types.SocPromise {
        return this.exec("add", data).then((results: any) => {
            if (results.length === 0) return Promise.resolve(null);
            return this.recoverDataFromChangedItems(results.shift().ret);
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
        if (ids) {
            ids = this.stringfySearchQuery(ids);
            this.queryVal.push("=numbers=" + ids);
        }
        let disabledIds = utils.lookForIdParameterAndReturnItsValue(this.queryVal);
        return this.queryForIdsIfNeeded(disabledIds).then((ids: string) => {
            disabledIds = ids;
            return this.exec("disable");
        }).then((response: any[]) => {
            return this.recoverDataFromChangedItems(disabledIds);
        });
    }
    
    /**
     * Delete one or more entries
     * 
     * @param ids the id(s) or number(s) to delete
     */
    public delete(ids?: Types.Id): Types.SocPromise {
        return this.remove(ids);
    }

    /**
     * Enable one or more entries
     * 
     * @param ids the id(s) or number(s) to enable
     */
    public enable(ids?: Types.Id): Types.SocPromise {
        if (ids) {
            ids = this.stringfySearchQuery(ids);
            this.queryVal.push("=numbers=" + ids);
        }
        let enabledIds = utils.lookForIdParameterAndReturnItsValue(this.queryVal);
        return this.queryForIdsIfNeeded(enabledIds).then((ids: string) => {
            enabledIds = ids;
            return this.exec("enable");
        }).then((response: any[]) => {
            return this.recoverDataFromChangedItems(enabledIds);
        });
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
        return this.translateQueryIntoId(query).then((consultedQuery) => {
            return this.write(consultedQuery);
        }).then((results) => {
            // Only runs when using the place-after feature
            // otherwise it will return the response immediately
            return this.prepareToPlaceAfter(results);
        });
    }

    /**
     * Move a queried rule above another.
     * 
     * @param to where to move the queried rule
     */
    public moveAbove(to?: string): Types.SocPromise {
        let movedIds = utils.lookForIdParameterAndReturnItsValue(this.queryVal);
        return this.queryForIdsIfNeeded(movedIds).then((ids: string) => {
            movedIds = ids;
            if (to) this.queryVal.push("=destination=" + to);
            return this.exec("move");
        }).then(() => {
            return this.recoverDataFromChangedItems(movedIds);
        });
    }

    /**
     * Update an entry or set of entries of the menu
     * 
     * @param data the new data to update the item
     * @param ids optional id(s) of the rules
     */
    public update(data: object, ids?: Types.Id): Types.SocPromise {
        if (ids) {
            ids = this.stringfySearchQuery(ids);
            this.queryVal.push("=numbers=" + ids);
        }
        
        let updatedIds = utils.lookForIdParameterAndReturnItsValue(this.queryVal);

        return this.queryForIdsIfNeeded(updatedIds).then((ids: string) => {
            updatedIds = ids;
            this.makeQuery(data);
            return this.exec("set");
        }).then((response: any[]) => {
            return this.recoverDataFromChangedItems(updatedIds);
        });
    }

    /**
     * Unset a property or set of properties of one or more entries
     * 
     * @param properties one or more properties to unset
     * @param ids the id(s) of the entries to unset the property(ies)
     */
    public unset(properties: string | string[], ids?: Types.Id): Types.SocPromise {
        if (ids) {
            ids = this.stringfySearchQuery(ids);
            this.queryVal.push("=numbers=" + ids);
        }

        let updatedIds = utils.lookForIdParameterAndReturnItsValue(this.queryVal);

        return this.queryForIdsIfNeeded(updatedIds).then((ids: string) => {
            updatedIds = ids;

            if (typeof properties === "string") properties = [properties];

            const $q: Types.SocPromise[] = [];

            // Saving current queryVal for reuse, since running exec will reset it
            const curQueryVal = this.queryVal.slice();

            // Cleaning current queryVal to prevent duplication
            this.queryVal = [];
            properties.forEach((property) => {
                // Putting back queryVal after a cleanup
                this.queryVal = curQueryVal.slice();
                this.queryVal.push("=value-name=" + utils.camelCaseOrSnakeCaseToDashedCase(property));
                $q.push(this.exec("unset"));
            });
            return Promise.all($q);
        }).then(() => {
            return this.recoverDataFromChangedItems(updatedIds);
        });
    }

    /**
     * Removes an entry or set of entries of the menu
     * 
     * @param ids optional id(s) to be removed from the menu
     */
    public remove(ids?: any): Types.SocPromise {
        if (ids) {
            ids = this.stringfySearchQuery(ids);
            this.queryVal.push("=numbers=" + ids);
        }

        const idsForRemoval = utils.lookForIdParameterAndReturnItsValue(this.queryVal);

        let responseData;
        return this.queryForIdsIfNeeded(idsForRemoval).then((ids: string) => {
            return this.recoverDataFromChangedItems(ids);
        }).then((response: any) => {
            responseData = response;
            return this.exec("remove");
        }).then(() => {
            return Promise.resolve(responseData);
        });
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
     * Moves a rule ABOVE the destination
     * 
     * @param from the rule you want to move
     * @param to the destination where you want to move
     */
    protected moveEntry(from: Types.Id, to?: string | number): Types.SocPromise {
        if (!Array.isArray(from)) from = [from];
        from = this.stringfySearchQuery(from);
        this.queryVal.push("=numbers=" + from);
        if (to) {
            to = this.stringfySearchQuery(to);
            this.queryVal.push("=destination=" + to);
        }
        const movedIds = utils.lookForIdParameterAndReturnItsValue(this.queryVal);
        return this.exec("move").then(() => {
            return this.recoverDataFromChangedItems(movedIds);
        });
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
    protected makeQuery(searchParameters: object, addQuestionMark: boolean = false, addToLocalQuery: boolean = true): string[] {
        let tmpKey: string;
        let tmpVal: string | number | boolean | null;

        const tmpQuery = addToLocalQuery ? this.queryVal : [];

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
                } else if (typeof tmpVal === "object") {
                    tmpVal = this.stringfySearchQuery(tmpVal);
                } else if (tmpKey === "placeAfter") {
                    this.placeAfter = tmpVal;
                    tmpKey = "placeBefore";
                }                

                tmpKey = (addQuestionMark ? "?" : "=") + tmpKey;

                tmpKey = utils.camelCaseOrSnakeCaseToDashedCase(tmpKey);

                tmpQuery.push(tmpKey + "=" + tmpVal);
            }
        }

        return tmpQuery;
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
        });
    }

    /**
     * Translates .id, place-before and number without using internal
     * mikrotik id (something like *4A).
     * 
     * This should check if one of those parameters are an object
     * and use that object to search the real id of the item.
     * 
     * @param queries query array
     */
    protected translateQueryIntoId(queries: string[]): Promise<any> {
        if (queries.length === 0 || !this.needsObjectTranslation) return Promise.resolve(queries);
        
        const promises = [];
        const consultedIndexes = [];

        for (const [index, element] of queries.entries()) {
            const str = element.replace(/^\?/, "").replace(/^\=/, "");
            if (str.includes(".id=") || str.includes("place-before=") || str.includes("place-after=") || str.includes("numbers=")) {
                
                if (/\{.*\}/.test(str)) {
                    const key = str.split("=").shift();
                    const value = JSON.parse(str.split("=").pop());
                    const treatedQuery = [
                        this.pathVal + "/print",
                        "=.proplist=.id"
                    ].concat(this.makeQuery(value, true, false));
                    const promise = this.rosApi.write(treatedQuery);
                    consultedIndexes.push({
                        index: index,
                        key: key
                    });
                    promises.push(promise);
                }
                
            }
        } 

        return Promise.all(promises).then((results) => {
            for (let result of results) {
                if (Array.isArray(result)) result = result.shift();
                const consulted = consultedIndexes.shift();
                if (!result) return Promise.reject(new RosException("REFNOTFND", { key: consulted.key}));
                if (consulted.key === "place-after") {
                    this.placeAfter = result[".id"];
                    consulted.key = "place-before";
                }
                queries[consulted.index] = "=" + consulted.key + "=" + result[".id"];
            }
            this.needsObjectTranslation = false;
            return Promise.resolve(queries);
        });
    }

    /**
     * If the place-after feature was used, the rule below
     * will be moved above here.
     * 
     * @param results 
     */
    protected prepareToPlaceAfter(results): Promise<any> {
        if (!this.placeAfter || results.length !== 1) return Promise.resolve(results);
        if (!results[0].ret) return Promise.resolve(results);
        const from = this.placeAfter;
        const to = results[0].ret;
        this.placeAfter = null;
        return this.moveEntry(from, to).then(() => {
            return Promise.resolve(results);
        });
    }

    /**
     * Transform mikrotik properties to either camelCase or snake_case
     * and casts values of true or false to boolean and
     * integer strings to number
     * 
     * @param results the result set of an operation
     */
    protected treatMikrotikProperties(results: object[]): object[] {
        const treatedArr: object[] = [];
        results.forEach((result) => {
            const tmpItem = {
                $$path: this.pathVal
            };
            for (const key in result) {
                if (result.hasOwnProperty(key)) {
                    const tmpVal = result[key];
                    let tmpKey = this.snakeCase
                        ? utils.dashedCaseToSnakeCase(key)
                        : utils.dashedCaseToCamelCase(key);
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

    /**
     * Stringify a json formated object to be used later
     * for a translation
     * 
     * @param items object items to stringfy
     */
    private stringfySearchQuery(items: any): any {
        let isArray = true;
        const newItems = [];
        if (!Array.isArray(items)) {
            isArray = false;
            items = [items];
        }
        for (const item of items) {
            if (typeof item === "object") {
                this.needsObjectTranslation = true;
                newItems.push(JSON.stringify(item));
            } else newItems.push(item);
        }
        return isArray ? newItems : newItems.shift();
    }

    /**
     * Clean data print of provided ids, used only when
     * creating, editting or unsetting properties
     * 
     * @param data 
     * @param ids 
     */
    private recoverDataFromChangedItems(ids?: string): Promise<any | any[]> {
        if (!ids) {
            return this.rosApi.write([this.pathVal + "/print"])
                .then((data) => Promise.resolve(this.treatMikrotikProperties(data).shift()));
        }

        const promises = [];
        const splittedIds = ids.split(",");
        for (const id of splittedIds) {
            const promise = this.rosApi.write([
                this.pathVal + "/print",
                "?.id=" + id
            ]);
            promises.push(promise);
        }
        return Promise.all(promises).then((data) => {
            if (!data) return Promise.resolve(data);
            data = flatten(data);
            data = this.treatMikrotikProperties(data);
            if (!ids.includes(",")) return Promise.resolve(data.shift());
            return Promise.resolve(data);
        });
    }

    /**
     * If trying do any action without providing any id, just
     * a query. Find all their ids and return them
     * 
     * @param ids 
     */
    private queryForIdsIfNeeded(ids?: string): Promise<string> {
        if (ids) return Promise.resolve(ids);

        this.queryVal.push("=.proplist=.id");
        const query = this.fullQuery("/print");
        let queriedIds;
        return this.write(query).then((data: any[]) => {
            data = reduce(data, (result, value, key) => {
                result.push(value.id);
                return result;
            }, []);
            queriedIds = data + "";
            if (queriedIds) this.queryVal.push("=numbers=" + queriedIds);
            return Promise.resolve(queriedIds);
        });
    }

}
