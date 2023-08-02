import { SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { NetworkService } from "spinal-model-bmsnetwork";
import { SpinalAttribute } from "spinal-models-documentation/declarations";
export declare const networkService: NetworkService;
export interface IBmsEndPointsObj {
    CAFET: SpinalNodeRef;
    RIE: SpinalNodeRef;
    BUILDING: SpinalNodeRef;
    AUDITORIUM: SpinalNodeRef;
}
export interface IControlPointsObj {
    AFFLU_CAFET: SpinalNodeRef;
    AFFLU_RIE: SpinalNodeRef;
    OCCUP_BUILDING: SpinalNodeRef;
    OCCUP_CAFET: SpinalNodeRef;
    OCCUP_RIE: SpinalNodeRef;
    OCCUP_AUDITORIUM: SpinalNodeRef;
}
/**
 * @export
 * @class UtilsAttendance
 */
export declare class UtilsAttendance {
    /**
     * Returns a promise of IBmsEndPointsObj with the model of the right endpoints
     * @param  {string} contextName
     * @param  {string} networkName
     * @returns {Promise<IBmsEndPointsObj>} Promise
     */
    getUbigreenEndpoints(contextName: string, networkName: string): Promise<IBmsEndPointsObj>;
    /**
     * Returns a promise of IControlPointsObj with the model of the right control_endpoints
     * @param  {string} id of the node
     * @returns {Promise<IControlPointsObj>} Promise
     */
    private getControlPoints;
    /**
     * Returns a promise of IControlPointsObj with the model of the right control_endpoints for the building node
     * @returns {Promise<IControlPointsObj>} Promise
     */
    getAttendanceControlPoint(): Promise<IControlPointsObj>;
    /**
     * Returns the capacity attribute of the node
     * @param  {string} id of the node
     * @returns {Promise<SpinalAttribute>} Promise
     */
    getCapacityAttribute(id: string): Promise<SpinalAttribute>;
    /**
     * Function that binds to the endpoints and update the control_endpoints with the right value of attendance ratio
     * The update is applied at the first run
     * @param  {IControlPointsObj} controlPointObj
     * @param  {IBmsEndPointsObj} endpointObj
     * @returns {void} Promise
     */
    bindEndpointToControlpoint(controlPointObj: IControlPointsObj, endpointObj: IBmsEndPointsObj): Promise<void>;
    /**
     * Calculates the attendance ration and retruns it with two digits after the decimal point
     * @param  {number} currentValue
     * @param  {number} totalCapacity
     * @returns {number}
     */
    calculateRatio(currentValue: number, totalCapacity: number): number;
    /**
     * @param  {IControlPointsObj} controlPointObj
     * @param  {IBmsEndPointsObj} endpointObj
     * @returns Promise
     */
    calculateOccupation(controlPointObj: IControlPointsObj, endpointObj: IBmsEndPointsObj): Promise<void>;
    /**
     * Function that updates a control endpoint value
     * @param  {string} targetId - Id of the Node to update
     * @param  {any} valueToPush - The new value
     * @param  {any} dataType - Type of the data ( see InputDataEndpoint data types)
     * @param  {any} type - Type ( not really used )
     * @returns Promise
     */
    updateControlEndpoint(targetId: string, valueToPush: any, dataType: any, type: any): Promise<void>;
}
