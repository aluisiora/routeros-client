import { RouterOSAPI, RosException } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";
import * as Types from "./Types";

export class RosApiModel extends RouterOSAPICrud {

    /**
     * The original item before applying the properties in the object
     */
    private originalItem: any;

    /**
     * Creates a model over the item provided,
     * giving options do edit, move, remove and etc
     * 
     * @param rosApi the raw api
     * @param item the item to create a model
     * @param snakeCase if should turn properties to snake_case instead of camelCase
     */
    constructor(rosApi: RouterOSAPI, item: any, snakeCase: boolean) {
        super(rosApi, item.$$path, snakeCase);
        this.originalItem = item;
        this.dissolveProperties();
    }

    /**
     * Alias to remove
     */
    public delete(): Types.SocPromise {
        return this.remove();
    }

    /**
     * Disable itself
     */
    public disable(): Types.SocPromise {
        return super.disable(this.originalItem.id).then((response) => {
            return this.refreshData(response);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Enable itself
     */
    public enable(): Types.SocPromise {
        return super.enable(this.originalItem.id).then((response) => {
            return this.refreshData(response);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Move itself above the id provided, or to the end if none provided
     * 
     * @param to where to move to
     */
    public move(to?: string | number): Types.SocPromise {
        return super.moveEntry(this.originalItem.id, to).then((response) => {
            return this.refreshData(response);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Unset properties of itself
     * @param properties properties to unset
     */
    public unset(properties: string | string[]): Types.SocPromise {
        return super.unset(properties, this.originalItem.id).then((response) => {
            return this.refreshData(response);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Updates itself with the data provided
     * 
     * @param data new data to update to
     */
    public update(data: object): Types.SocPromise {
        return super.update(data, this.originalItem.id).then((response) => {
            return this.refreshData(response);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    /**
     * Removes itself
     */
    public remove(): Types.SocPromise {
        return super.remove(this.originalItem.id);
    }

    /**
     * Alias to update
     * 
     * @param data new data to update to
     */
    public set(data: object): Types.SocPromise {
        return this.update(data);
    }

    /**
     * Removes all dissolved item properties assigned to
     * this object
     */
    private cleanDissolvedProperties(): void {
        for (const property in this.originalItem) {
            if (this.originalItem.hasOwnProperty(property)) {
                delete this[property];
            }
        }
    }

    /**
     * Dissolves all properties of the item into this
     * object
     */
    private dissolveProperties(): void {
        for (const property in this.originalItem) {
            if (this.originalItem.hasOwnProperty(property)) {
                this[property] = this.originalItem[property];
            }
        }
    }

    /**
     * Refresh this object with new data of the item
     * after printing it again
     */
    private refreshData(response: any): Types.SocPromise {
        this.cleanDissolvedProperties();
        this.originalItem = response;
        this.dissolveProperties();
        return Promise.resolve(this);
    }

}
