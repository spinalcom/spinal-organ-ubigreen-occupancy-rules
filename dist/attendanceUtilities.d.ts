import { NetworkService } from "spinal-model-bmsnetwork";
export declare const networkService: NetworkService;
/**
 * @export
 * @class UtilsAttendance
 */
export declare class UtilsAttendance {
    getUbigreenEndpoints(contextName: string, networkName: string): Promise<{}>;
    getAttendanceControlPoint(): Promise<object>;
    private getControlPoints;
    private getCapacityAttribute;
    /**
    * Function that updates a control endpoint value
    * @param  {string} targetId - Id of the Node to update
    * @param  {any} valueToPush - The new value
    * @param  {any} dataType - Type of the data ( see InputDataEndpoint data types)
    * @param  {any} type - Type ( not really used )
    * @returns Promise
    */
    private updateControlEndpoint;
    bindEndpointToControlpoint(controlPointObj: object, endpointObj: object): Promise<void>;
    private calculateRatio;
}
