import { SpinalNodeRef } from "spinal-env-viewer-graph-service";
import { NetworkService } from "spinal-model-bmsnetwork";
export declare const networkService: NetworkService;
/**
 * @export
 * @class UtilsWorkingPositions
 */
export declare class UtilsWorkingPositions {
    ENDPOINTS_LAST_MODIFICATION: Object;
    CONTROL_POINT_RELEASE: Object;
    DEFAULT_INTERVAL_TIME: Number;
    WORKING_HOURS: object;
    constructor();
    /**
     * @param  {string} contextName
     * @param  {string} categoryName
     * @returns Promise
     */
    getWorkPositions(contextName: string, categoryName: string): Promise<Array<SpinalNodeRef>>;
    getControlPoint(workpositionId: string): Promise<SpinalNodeRef>;
    getOccupancyBmsEndpoint(workPositionModel: SpinalNodeRef): Promise<SpinalNodeRef>;
    bindEndpointToControlpoint(controlPoint: SpinalNodeRef, endpoint: SpinalNodeRef, workPositionName: string): Promise<void>;
    bindControlpointToRelease(controlPoint: SpinalNodeRef, endpoint: SpinalNodeRef, workPositionName: string): Promise<void>;
    private useCasesRelease;
    private useCases;
    private calculateIntervalTime;
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
