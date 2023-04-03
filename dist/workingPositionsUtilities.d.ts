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
     * Search and returns a list of BIMObject models (working positions)
     * @param  {string} contextName
     * @param  {string} categoryName
     * @returns {Promise<Array<SpinalNodeRef>>}
     */
    getWorkPositions(contextName: string, categoryName: string): Promise<Array<SpinalNodeRef>>;
    /**
     * Returns all control_endpoints of the node
     * @param  {string} workpositionId - id of the nodes
     * @returns {Promise<SpinalNodeRef>} Promise
     */
    getControlPoint(workpositionId: string): Promise<SpinalNodeRef>;
    /**
     * Returns the occupancy endpoint of a node
     * @param  {SpinalNodeRef} workPositionModel - model of the node
     * @returns {Promise<SpinalNodeRef>} Promise
     */
    getOccupancyBmsEndpoint(workPositionModel: SpinalNodeRef): Promise<SpinalNodeRef>;
    /**
     * Function that binds to the endpoints and update the control_endpoints after analysing the use cases of occupancy
     * The update is applied at the first run
     * @param  {SpinalNodeRef} controlPoint - model of the control_endpoint
     * @param  {SpinalNodeRef} endpoint - model of the endpoint
     * @param  {string} workPositionName - BimObject name
     * @returns {void} Promise
     */
    bindEndpointToControlpoint(controlPoint: SpinalNodeRef, endpoint: SpinalNodeRef, workPositionName: string): Promise<void>;
    /**
     * Function that binds to the control_endpoints and reset their values if the user send a release order (value=2)
     * The update is applied at the first run
     * @param  {SpinalNodeRef} controlPoint - model of the control_endpoint
     * @param  {SpinalNodeRef} endpoint - model of the endpoint
     * @param  {string} workPositionName - BimObject name
     * @returns {void} Promise
     */
    bindControlpointToRelease(controlPoint: SpinalNodeRef, endpoint: SpinalNodeRef, workPositionName: string): Promise<void>;
    /**
     * Function that analyse the multiple use cases for releasing the occupancy of a working position
     * @param  {string} endpointId
     * @param  {string} endpointValue
     * @param  {string} controlPointId
     * @param  {string} controlPointValue
     * @param  {string} workPositionName
     * @returns {void} Promise
     */
    private useCasesRelease;
    /**
     * Function that analyse the multiple use cases for the occupancy of a working position
     * @param  {string} endpointId
     * @param  {string} endpointValue
     * @param  {string} controlPointId
     * @param  {string} controlPointValue
     * @param  {string} workPositionName
     * @returns {void} Promise
     */
    private useCases;
    /**
     * Calculates the interval time between two dates
     * @param  {number} lastDate
     * @param  {number} newDate
     * @returns number
     */
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
