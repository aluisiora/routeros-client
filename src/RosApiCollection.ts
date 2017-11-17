import { RouterOSAPI, RosException } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";
import * as Types from "./Types";

export class RosApiCollection extends RouterOSAPICrud {

    private originalItem: any;

    constructor(rosApi: RouterOSAPI, item: any, snakeCase: boolean) {
        super(rosApi, item.$$path, snakeCase);
        this.originalItem = item;
        this.dissolveProperties();
    }

    public delete(): Types.SocPromise {
        return this.remove();
    }

    public disable(): Types.SocPromise {
        return super.disable(this.originalItem.id).then(() => {
            return this.refreshData();
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public enable(): Types.SocPromise {
        return super.enable(this.originalItem.id).then(() => {
            return this.refreshData();
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public move(to?: string | number): Types.SocPromise {
        return super.move(this.originalItem.id, to).then(() => {
            return this.refreshData();
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public unset(properties: string | string[]): Types.SocPromise {
        return super.unset(properties, this.originalItem.id).then(() => {
            return this.refreshData();
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public update(data: object): Types.SocPromise {
        return super.update(data, this.originalItem.id).then(() => {
            return this.refreshData();
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

    public remove(): Types.SocPromise {
        return super.remove(this.originalItem.id);
    }

    public set(data: object): Types.SocPromise {
        return this.update(data);
    }

    private cleanDissolvedProperties(): void {
        for (const property in this.originalItem) {
            if (this.originalItem.hasOwnProperty(property)) {
                delete this[property];
            }
        }
    }

    private dissolveProperties(): void {
        for (const property in this.originalItem) {
            if (this.originalItem.hasOwnProperty(property)) {
                this[property] = this.originalItem[property];
            }
        }
    }

    private refreshData(): Types.SocPromise {
        const originalQueryVal = this.queryVal.slice();
        const originalProplistVal = this.proplistVal;
        return this.write([
            this.originalItem.$$path + "/print",
            "?.id=" + this.originalItem.id
        ]).then((response: any[]) => {
            this.cleanDissolvedProperties();
            this.originalItem = response[0];
            this.dissolveProperties();
            this.queryVal = originalQueryVal;
            this.proplistVal = originalProplistVal;
            return Promise.resolve(this);
        }).catch((err: RosException) => {
            return Promise.reject(err);
        });
    }

}
