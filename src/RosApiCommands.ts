import { RouterOSAPI, RosException, RStream } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";
import { RosApiModel } from "./RosApiModel";
import * as Types from "./Types";
import * as debug from "debug";

const info = debug("routeros-client:commands:info");
const error = debug("routeros-client:commands:error");

export class RosApiCommands extends RouterOSAPICrud {

    /**
     * Creates a set of operations to do over a menu
     * 
     * @param rosApi The raw API
     * @param path The menu path we are doing actions on
     * @param snakeCase If we should use snake_case
     */
    constructor(rosApi: RouterOSAPI, path: string, snakeCase: boolean) {
        super(rosApi, path, snakeCase);
    }

    /**
     * Limits the returned fields when printing
     * 
     * @param fields Fields to return
     */
    public select(fields: string | string[]): RosApiCommands {
        let commaFields: string = "=.proplist=";
        if (typeof fields === "string") fields = [fields];

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            if (/^(id|dead|nextid)$/.test(field)) fields[i] = "." + field;
        }

        // Convert array to a string comma separated 
        commaFields += fields;
        this.proplistVal = commaFields;
        return this;
    }

    /**
     * Moves a rule ABOVE the destination
     * 
     * @param from the rule you want to move
     * @param to the destination where you want to move
     */
    public move(from: Types.Id, to?: string | number) {
        return super.moveEntry(from, to);
    }

    /**
     * Alias for select()
     * @param fields Fields to return
     */
    public only(fields: string | string[]): RosApiCommands {
        return this.select(fields);
    }

    /**
     * Add an option to the command. As an example: count-only or detail
     * 
     * @param opts an option or array of options
     * @param args multiple strings of parameters of options
     */
    public options(opts: string | string[], ...args: string[]): RosApiCommands {
        if (typeof opts === "string") opts = [opts];
        opts = opts.concat(args || []);
        const optObj = {};
        for (const opt of opts) optObj[opt] = "";
        return this.where(optObj, "", false);
    }

    /**
     * Alias for select()
     * @param fields 
     */
    public proplist(fields: string | string[]): RosApiCommands {
        return this.select(fields);
    }

    /**
     * Filters the content when printing or define which item
     * will do actions to when not printing
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     * @param addQuestionMark if will start the sentence with a question mark (?), else, starts with equal (=)
     */
    public where(key: object | string, value: string = "", addQuestionMark: boolean = true): RosApiCommands {
        let search: object = new Object();
        if (typeof key === "string") {
            search[key] = value;
        } else {
            search = key;
        }
        this.makeQuery(search, addQuestionMark);
        return this;
    }

    /**
     * Alias to where, but without adding question marks
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public query(key: object | string, value?: string): RosApiCommands {
        return this.where(key, value, false);
    }

    /**
     * Alias to where, but without adding question marks
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public filter(key: object | string, value?: string): RosApiCommands {
        return this.where(key, value, false);
    }

    /**
     * Raw API syntax to be added to the stack
     * 
     * @param search array of sentences to send over the api
     */
    public whereRaw(search: string[]): RosApiCommands {
        this.queryVal = this.queryVal.concat(search);
        return this;
    }

    /**
     * Adds an OR operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public orWhere(key: object | string, value?: string): RosApiCommands {
        this.where(key, value);
        this.queryVal.push("?#|");
        return this;
    }

    /**
     * Adds a NOT and then OR operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public orWhereNot(key: object | string, value?: string): RosApiCommands {
        this.where(key, value);
        this.queryVal.push("?#!", "?#|");
        return this;
    }

    /**
     * Adds an AND operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public andWhere(key: object | string, value?: string): RosApiCommands {
        this.where(key, value);
        this.queryVal.push("?#&");
        return this;
    }

    /**
     * Adds a NOT and then an AND operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public andWhereNot(key: object | string, value?: string): RosApiCommands {
        this.where(key, value);
        this.queryVal.push("?#!", "?#&");
        return this;
    }

    /**
     * Adds an NOT operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public whereNot(key: object | string, value?: string): RosApiCommands {
        this.where(key, value);
        this.queryVal.push("?#!");
        return this;
    }

    /**
     * Adds a HIGHER THAN (>) operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public whereHigher(key: object | string, value?: string): RosApiCommands {
        this.where(">" + key, value);
        return this;
    }

    /**
     * Adds a LOWER THAN (<) operator when filtering content
     * 
     * @param key a key to a value or an object with keys and values to filter
     * @param value the value if a string key is passed
     */
    public whereLower(key: object | string, value?: string): RosApiCommands {
        this.where("<" + key, value);
        return this;
    }

    /**
     * Checks if the parameter or key exists by having a value when filtering
     * 
     * @param key the parameter to check
     */
    public whereExists(key: string): RosApiCommands {
        return this.whereHigher(key);
    }

    /**
     * Alias to whereExists
     * 
     * @param key the parameter to check
     */
    public whereNotEmpty(key: string): RosApiCommands {
        return this.whereHigher(key);
    }

    /**
     * Check if the parameter or key doesn't exist or has no value when filtering
     * 
     * @param key the parameter to check
     */
    public whereEmpty(key: string): RosApiCommands {
        this.where("-" + key);
        return this;
    }

    /**
     * Alias of whereEmpty
     * 
     * @param key the parameter to check
     */
    public whereNotExists(key: string): RosApiCommands {
        return this.whereEmpty(key);
    }

    /**
     * Prints the data of the menu
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public get(data?: object): Types.SocPromise {
        if (data) this.makeQuery(data, true);
        const query = this.fullQuery("/print");
        return this.write(query);
    }

    /**
     * Alias of get
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getAll(data?: object): Types.SocPromise {
        return this.get(data);
    }

    /**
     * Alias of get, but in the process creates a model
     * of each item returned
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getModel(data?: object): Types.SocPromise {
        return this.get(data).then((results) => {
            for (let i = 0; i < results.length; i++) {
                results[i] = new RosApiModel(this.rosApi, results[i], this.snakeCase);
            }
            return Promise.resolve(results);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Alias of get
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public print(data?: object): Types.SocPromise {
        return this.get(data);
    }

    /**
     * Alias of find
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public first(data?: object): Promise<object> {
        return this.find(data);
    }

    /**
     * Returns the first item if found, else return null
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public find(data?: object): Promise<object> {
        return this.get(data).then((results) => {
            let result: object = new Object();
            if (results.length > 0) result = results[0];
            else result = null;
            return Promise.resolve(result);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Alias of find
     * 
     * @param data optional filtering, like what you get when using the where function
     */
    public getOne(data?: object): Promise<object> {
        return this.find(data);
    }

    /**
     * Alias of find
     * 
     * @param data optional filtering, like what you get when using the where function
     */
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
        ]).then((results: object[]) => {
            const ids = results.map((result) => {
                return result[".id"];
            });
            return this.write([
                this.pathVal + "/remove",
                "=numbers=" + ids
            ]);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Start a streaming of content and returns a Stream object
     * so it can be paused, resumed or stopped
     * 
     * @param action optional action to add when streaming, like "listen" for example
     * @param callback 
     */
    public stream(action: any, callback?: (err: Error, packet?: any, stream?: RStream) => void): RStream {
        if (typeof action === "function") {
            callback = action;
            action = "";
        } else if (action && typeof action === "string") {
            action = "/" + action.replace(/^\//, "");
        }

        const query = this.fullQuery(action);
        info("Streaming query %o", query);
        this.queryVal = [];
        this.proplistVal = "";

        if (!callback) {
            const stream = this.rosApi.stream(query);
            stream.on("data", (packet: any) => {
                if (!Array.isArray(packet)) {
                    packet = this.treatMikrotikProperties([packet])[0];
                } else {
                    packet = this.treatMikrotikProperties(packet);
                }
                stream.emit("parsed-data", packet);
            });
            stream.on("error", (err: any) => {
                err = this.treatMikrotikProperties([err])[0];
                stream.emit("parsed-error", err);
            });
            return stream;
        }

        return this.rosApi.stream(query, (err: RosException, packet: any, stream: RStream) => {
            if (err) error("When streaming, got error: %o", err);
            if (typeof callback === "function") {
                if (packet) {
                    info("Received stream packet: %o", packet);
                    if (!Array.isArray(packet)) {
                        packet = this.treatMikrotikProperties([packet])[0];
                    } else {
                        packet = this.treatMikrotikProperties(packet);
                    }
                }
                callback(err, packet, stream);
            }
        });
    }

}
