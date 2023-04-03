"use strict";
/*
 * Copyright 2023 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilsWorkingPositions = exports.networkService = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const constants = require("./constants");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
exports.networkService = new spinal_model_bmsnetwork_1.NetworkService();
/**
 * @export
 * @class UtilsWorkingPositions
 */
class UtilsWorkingPositions {
    constructor() {
        this.ENDPOINTS_LAST_MODIFICATION = {};
        this.CONTROL_POINT_RELEASE = {};
        this.DEFAULT_INTERVAL_TIME = constants.INTERVAL_TIME;
        this.WORKING_HOURS = constants.WORKING_HOURS;
    }
    /**
     * Search and returns a list of BIMObject models (working positions)
     * @param  {string} contextName
     * @param  {string} categoryName
     * @returns {Promise<Array<SpinalNodeRef>>}
     */
    async getWorkPositions(contextName, categoryName) {
        let context = undefined;
        let category = undefined;
        //get context
        let workPositionContext = await spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("BIMObjectGroupContext");
        workPositionContext.forEach(elt => {
            if (elt.info.name.get() == contextName)
                context = elt;
        });
        //get category
        let children = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(context.info.id.get(), ["hasCategory"]);
        children.forEach(elt => {
            if (elt.name.get() == categoryName)
                category = elt;
        });
        //get bimObjects
        let workPositions = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(category.id.get(), context.info.id.get(), (elt) => {
            if (elt.info.type.get() == "BIMObject") {
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
                return true;
            }
            return false;
        });
        // console.log("workPositions : ", workPositions);
        return workPositions;
    }
    /**
     * Returns all control_endpoints of the node
     * @param  {string} workpositionId - id of the nodes
     * @returns {Promise<SpinalNodeRef>} Promise
     */
    async getControlPoint(workpositionId) {
        const NODE_TO_CONTROL_POINTS_RELATION = "hasControlPoints";
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let allControlPoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(workpositionId, [NODE_TO_CONTROL_POINTS_RELATION]);
        if (allControlPoints.length != 0) {
            for (let controlPoint of allControlPoints) {
                let allBmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                if (allBmsEndpoints.length != 0) {
                    for (let bmsEndPoint of allBmsEndpoints) {
                        if (bmsEndPoint.name.get().toLowerCase() == "statut-occupation")
                            return bmsEndPoint;
                    }
                }
            }
        }
        // console.log("workPositions command controlPoints : ",commandControlPoint);
        return undefined;
    }
    /**
     * Returns the occupancy endpoint of a node
     * @param  {SpinalNodeRef} workPositionModel - model of the node
     * @returns {Promise<SpinalNodeRef>} Promise
     */
    async getOccupancyBmsEndpoint(workPositionModel) {
        if (workPositionModel != undefined) {
            let bmsDevices = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(workPositionModel.id.get(), ["hasBmsDevice"]);
            if (bmsDevices.length != 0) {
                for (let device of bmsDevices) {
                    let bmsEndPoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                    if (bmsEndPoints.length != 0) {
                        for (let bms of bmsEndPoints) {
                            if (((bms.name.get()).toLowerCase()).includes("occupation"))
                                return bms;
                        }
                    }
                }
            }
        }
        return undefined;
    }
    /**
     * Function that binds to the endpoints and update the control_endpoints after analysing the use cases of occupancy
     * The update is applied at the first run
     * @param  {SpinalNodeRef} controlPoint - model of the control_endpoint
     * @param  {SpinalNodeRef} endpoint - model of the endpoint
     * @param  {string} workPositionName - BimObject name
     * @returns {void} Promise
     */
    async bindEndpointToControlpoint(controlPoint, endpoint, workPositionName) {
        if (controlPoint != undefined && endpoint != undefined) {
            let endpointId = endpoint.id.get();
            let controlPointId = controlPoint.id.get();
            let nodeEP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointId);
            let nodeCP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(controlPointId);
            let endpointValueModel = (await nodeEP.getElement(true)).currentValue;
            //bind le controlPoint aux endpoint
            endpointValueModel.bind(async () => {
                let hour = new Date().getHours();
                if (hour >= this.WORKING_HOURS["start"] || hour < this.WORKING_HOURS["end"]) {
                    let controlPointValue = (await nodeCP.getElement(true)).currentValue.get();
                    await this.useCases(endpointId, endpointValueModel.get(), controlPointId, controlPointValue, workPositionName);
                }
            }, true);
        }
    }
    /**
     * Function that binds to the control_endpoints and reset their values if the user send a release order (value=2)
     * The update is applied at the first run
     * @param  {SpinalNodeRef} controlPoint - model of the control_endpoint
     * @param  {SpinalNodeRef} endpoint - model of the endpoint
     * @param  {string} workPositionName - BimObject name
     * @returns {void} Promise
     */
    async bindControlpointToRelease(controlPoint, endpoint, workPositionName) {
        if (controlPoint != undefined && endpoint != undefined) {
            let endpointId = endpoint.id.get();
            let controlPointId = controlPoint.id.get();
            let nodeEP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointId);
            let nodeCP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(controlPointId);
            let controlPointValueModel = (await nodeCP.getElement(true)).currentValue;
            //bind le controlPoint aux endpoint
            controlPointValueModel.bind(async () => {
                let hour = new Date().getHours();
                if (hour >= this.WORKING_HOURS["start"] || hour < this.WORKING_HOURS["end"]) {
                    let endpointValue = (await nodeEP.getElement(true)).currentValue.get();
                    if (controlPointValueModel.get() == "2") {
                        await this.useCasesRelease(endpointId, endpointValue, controlPointId, controlPointValueModel.get(), workPositionName);
                    }
                }
            }, true);
        }
    }
    /**
     * Function that analyse the multiple use cases for releasing the occupancy of a working position
     * @param  {string} endpointId
     * @param  {string} endpointValue
     * @param  {string} controlPointId
     * @param  {string} controlPointValue
     * @param  {string} workPositionName
     * @returns {void} Promise
     */
    async useCasesRelease(endpointId, endpointValue, controlPointId, controlPointValue, workPositionName) {
        if (endpointValue == "0" && controlPointValue == "2") {
            await this.updateControlEndpoint(controlPointId, endpointValue, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
            console.log("<< " + workPositionName + ">> updated ==> value = " + endpointValue);
        }
        else if (endpointValue == "1" && controlPointValue == "2") {
            let date = new Date().getTime();
            this.CONTROL_POINT_RELEASE[endpointId] = date;
            delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
            await this.updateControlEndpoint(controlPointId, endpointValue, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            await this.useCases(endpointId, endpointValue, controlPointId, controlPointValue, workPositionName);
        }
    }
    /**
     * Function that analyse the multiple use cases for the occupancy of a working position
     * @param  {string} endpointId
     * @param  {string} endpointValue
     * @param  {string} controlPointId
     * @param  {string} controlPointValue
     * @param  {string} workPositionName
     * @returns {void} Promise
     */
    async useCases(endpointId, endpointValue, controlPointId, controlPointValue, workPositionName) {
        // endpoint = 0 to 1
        if (endpointValue == "1" && controlPointValue == "0") {
            let date = new Date().getTime();
            this.ENDPOINTS_LAST_MODIFICATION[endpointId] = date;
            await this.updateControlEndpoint(controlPointId, endpointValue, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            console.log("<< " + workPositionName + ">> updated ==> value = " + endpointValue);
        }
        // endpoint = 1 to 0
        else if (endpointValue == "0" && controlPointValue == "1") {
            let date = new Date().getTime();
            if (this.ENDPOINTS_LAST_MODIFICATION[endpointId] != undefined) {
                let interval = this.calculateIntervalTime(this.ENDPOINTS_LAST_MODIFICATION[endpointId], date);
                if (interval < this.DEFAULT_INTERVAL_TIME) { //last value has less than 5 minutes
                    await this.updateControlEndpoint(controlPointId, endpointValue, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
                    console.log("<< " + workPositionName + ">> updated ==> value = " + endpointValue);
                }
            }
            // for release
            else if (this.CONTROL_POINT_RELEASE[endpointId] != undefined) {
                let interval = this.calculateIntervalTime(this.CONTROL_POINT_RELEASE[endpointId], date);
                if (interval < this.DEFAULT_INTERVAL_TIME) { //last value has less than 5 minutes
                    await this.updateControlEndpoint(controlPointId, endpointValue, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                    delete this.CONTROL_POINT_RELEASE[endpointId];
                    console.log("<< " + workPositionName + ">> updated ==> value = " + endpointValue);
                }
            }
        }
    }
    /**
     * Calculates the interval time between two dates
     * @param  {number} lastDate
     * @param  {number} newDate
     * @returns number
     */
    calculateIntervalTime(lastDate, newDate) {
        let interval = newDate - lastDate; //ms
        // let minutes = interval / 60000;     //min
        return interval;
    }
    /**
     * Function that updates a control endpoint value
     * @param  {string} targetId - Id of the Node to update
     * @param  {any} valueToPush - The new value
     * @param  {any} dataType - Type of the data ( see InputDataEndpoint data types)
     * @param  {any} type - Type ( not really used )
     * @returns Promise
     */
    async updateControlEndpoint(targetId, valueToPush, dataType, type) {
        let node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(targetId);
        spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(node);
        let target = spinal_env_viewer_graph_service_1.SpinalGraphService.getInfo(targetId);
        if (valueToPush != undefined) {
            const input = {
                id: "",
                name: "",
                path: "",
                currentValue: valueToPush,
                unit: "",
                dataType: dataType,
                type: type,
                nodeTypeName: "BmsEndpoint" // should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
            };
            const time = new Date();
            await exports.networkService.updateEndpoint(target, input, time);
        }
        else {
            console.log(valueToPush + " value to push in node : " + target.info.name.get() + " -- ABORTED !");
        }
    }
}
exports.UtilsWorkingPositions = UtilsWorkingPositions;
//# sourceMappingURL=workingPositionsUtilities.js.map