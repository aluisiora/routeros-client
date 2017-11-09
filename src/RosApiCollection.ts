import { RouterOSAPI, RosException } from "node-routeros";
import { RouterOSAPICrud } from "./RosApiCrud";
import * as Types from "./Types";

export class RosApiCollection extends RouterOSAPICrud {

    private originalItem: any;

    constructor(rosApi: RouterOSAPI, path: string, item: any) {
        super(rosApi, path);
        this.originalItem = item;
        this.dissolveProperties();
    }

    public delete(): Types.SocPromise {
        return this.remove();
    }

    public disable(): Types.SocPromise {
        return super.disable(this.originalItem.id);
    }

    public enable(): Types.SocPromise {
        return super.enable(this.originalItem.id);
    }

    public move(to?: string | number): Types.SocPromise {
        return super.move(this.originalItem.id, to);
    }

    public unset(properties: string | string[]): Types.SocPromise {
        return super.unset(properties, this.originalItem.id);
    }

    public update(data: object): Types.SocPromise {
        return super.update(data, this.originalItem.id);
    }

    public remove(): Types.SocPromise {
        return this.exec("remove");
    }

    public set(data: object): Types.SocPromise {
        return this.update(data);
    }

    private dissolveProperties(): void {
        for (const property in this.originalItem) {
            if (this.originalItem.hasOwnProperty(property)) {
                this[property] = this.originalItem[property];
            }
        }
    }
}
