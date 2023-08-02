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
exports.UtilsAttendance = exports.networkService = void 0;
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const constants = require("./constants");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
exports.networkService = new spinal_model_bmsnetwork_1.NetworkService();
/**
 * @export
 * @class UtilsAttendance
 */
class UtilsAttendance {
    /**
     * Returns a promise of IBmsEndPointsObj with the model of the right endpoints
     * @param  {string} contextName
     * @param  {string} networkName
     * @returns {Promise<IBmsEndPointsObj>} Promise
     */
    async getUbigreenEndpoints(contextName, networkName) {
        let bmsEndPointsObj = {
            CAFET: undefined,
            RIE: undefined,
            BUILDING: undefined,
            AUDITORIUM: undefined
        };
        let networkContext = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContext(contextName));
        let contextId = networkContext.info.id.get();
        let [network] = await spinal_env_viewer_graph_service_1.SpinalGraphService.findInContext(contextId, contextId, (elt) => {
            if (elt.info.type.get() == "BmsNetwork" && (elt.info.name.get() == networkName)) {
                spinal_env_viewer_graph_service_1.SpinalGraphService._addNode(elt);
                return true;
            }
            return false;
        });
        if (network != undefined) {
            let devices = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(network.id.get(), ["hasBmsDevice"]);
            if (devices.length != 0) {
                for (let device of devices) {
                    if ((device.name.get().toLowerCase()).includes("rie")) {
                        let [bmsEndPoint] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.RIE = (bmsEndPoint);
                    }
                    else if ((device.name.get().toLowerCase()).includes("cafet")) {
                        let [bmsEndPoint] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.CAFET = (bmsEndPoint);
                    }
                    else if ((device.name.get().toLowerCase()).includes("entree")) {
                        let [bmsEndPoint] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.BUILDING = (bmsEndPoint);
                    }
                    else if ((device.name.get().toLowerCase()).includes("auditorium")) {
                        let [bmsEndPoint] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.AUDITORIUM = (bmsEndPoint);
                    }
                }
                return bmsEndPointsObj;
            }
        }
        return undefined;
    }
    /**
     * Returns a promise of IControlPointsObj with the model of the right control_endpoints
     * @param  {string} id of the node
     * @returns {Promise<IControlPointsObj>} Promise
     */
    async getControlPoints(id) {
        const NODE_TO_CONTROL_POINTS_RELATION = "hasControlPoints";
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let controlPointsObj = {
            AFFLU_CAFET: undefined,
            AFFLU_RIE: undefined,
            OCCUP_BUILDING: undefined,
            OCCUP_CAFET: undefined,
            OCCUP_RIE: undefined,
            OCCUP_AUDITORIUM: undefined
        };
        let allControlPoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(id, [NODE_TO_CONTROL_POINTS_RELATION]);
        if (allControlPoints.length != 0) {
            for (let controlPoint of allControlPoints) {
                let allBmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                if (allBmsEndpoints.length != 0) {
                    for (let bmsEndPoint of allBmsEndpoints) {
                        if (bmsEndPoint.name.get().toLowerCase().includes("_rie"))
                            controlPointsObj.AFFLU_RIE = (bmsEndPoint);
                        else if (bmsEndPoint.name.get().toLowerCase().includes("_cafet"))
                            controlPointsObj.AFFLU_CAFET = (bmsEndPoint);
                        else if (bmsEndPoint.name.get().toLowerCase().includes("bâtiment"))
                            controlPointsObj.OCCUP_BUILDING = (bmsEndPoint);
                        else if (bmsEndPoint.name.get().toLowerCase().includes(" cafétéria"))
                            controlPointsObj.OCCUP_CAFET = (bmsEndPoint);
                        else if (bmsEndPoint.name.get().toLowerCase().includes(" rie"))
                            controlPointsObj.OCCUP_RIE = (bmsEndPoint);
                        else if (bmsEndPoint.name.get().toLowerCase().includes("auditorium"))
                            controlPointsObj.OCCUP_AUDITORIUM = (bmsEndPoint);
                    }
                    return controlPointsObj;
                }
            }
        }
        return undefined;
    }
    /**
     * Returns a promise of IControlPointsObj with the model of the right control_endpoints for the building node
     * @returns {Promise<IControlPointsObj>} Promise
     */
    async getAttendanceControlPoint() {
        let spatialContext = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext"))[0];
        let spatialId = spatialContext.info.id.get();
        let [building] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(spatialId, ['hasGeographicBuilding']);
        let cp = await this.getControlPoints(building.id.get());
        return cp;
    }
    /**
     * Returns the capacity attribute of the node
     * @param  {string} id of the node
     * @returns {Promise<SpinalAttribute>} Promise
     */
    async getCapacityAttribute(id) {
        const LABEL = constants.CAPACITY_ATTRIBUTE;
        let node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(id);
        const [attribute] = await spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, "default", LABEL);
        return attribute;
    }
    /**
     * Function that binds to the endpoints and update the control_endpoints with the right value of attendance ratio
     * The update is applied at the first run
     * @param  {IControlPointsObj} controlPointObj
     * @param  {IBmsEndPointsObj} endpointObj
     * @returns {void} Promise
     */
    async bindEndpointToControlpoint(controlPointObj, endpointObj) {
        for (let x in endpointObj) {
            if (endpointObj[x] != undefined && !((x == "BUILDING") || (x == "AUDITORIUM"))) {
                let endpointId = endpointObj[x].id.get();
                let nodeEP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointId);
                let endpointValueModel = (await nodeEP.getElement(true)).currentValue;
                let controlPointId = controlPointObj["AFFLU_" + x].id.get();
                // let nodeCP = SpinalGraphService.getRealNode(controlPointId);
                //bind le controlPoint aux endpoint
                endpointValueModel.bind(async () => {
                    let capacity = await this.getCapacityAttribute(controlPointId);
                    let ratio = this.calculateRatio(endpointValueModel.get(), Number(capacity.value));
                    let value = undefined;
                    // if(nodeCP.info.name.get().toLowerCase().includes("entree")) value = ratio;
                    // else{
                    if (ratio >= 0 && ratio <= 30)
                        value = "Peu fréquenté";
                    else if (ratio > 30 && ratio <= 55)
                        value = "Assez fréquenté";
                    else if (ratio > 55 && ratio <= 80)
                        value = "Très fréquenté";
                    else if (ratio > 80)
                        value = "Saturé";
                    // }
                    await this.updateControlEndpoint(controlPointId, value, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                }, true);
            }
        }
    }
    /**
     * Calculates the attendance ration and retruns it with two digits after the decimal point
     * @param  {number} currentValue
     * @param  {number} totalCapacity
     * @returns {number}
     */
    calculateRatio(currentValue, totalCapacity) {
        let result = (currentValue / totalCapacity) * 100;
        return Math.round(result * 100) / 100;
    }
    /**
     * @param  {IControlPointsObj} controlPointObj
     * @param  {IBmsEndPointsObj} endpointObj
     * @returns Promise
     */
    async calculateOccupation(controlPointObj, endpointObj) {
        for (let x in endpointObj) {
            if (endpointObj[x] != undefined) {
                let nodeEP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointObj[x].id.get());
                let endpointValue = (await nodeEP.getElement(true)).currentValue.get();
                let controlPointId = controlPointObj["OCCUP_" + x].id.get();
                let capacity = await this.getCapacityAttribute(controlPointId);
                let ratio = this.calculateRatio(endpointValue, Number(capacity.value));
                await this.updateControlEndpoint(controlPointId, ratio, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
            }
        }
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
            console.log(node.info.name.get() + " updated ==> value = " + valueToPush);
        }
        else {
            console.log(valueToPush + " value to push in node : " + target.info.name.get() + " -- ABORTED !");
        }
    }
}
exports.UtilsAttendance = UtilsAttendance;
//# sourceMappingURL=attendanceUtilities.js.map