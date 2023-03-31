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
    async getUbigreenEndpoints(contextName, networkName) {
        let bmsEndPointsObj = {};
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
                        bmsEndPointsObj["RIE"] = (bmsEndPoint);
                    }
                    else if ((device.name.get().toLowerCase()).includes("cafet")) {
                        let [bmsEndPoint] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj["CAFET"] = (bmsEndPoint);
                    }
                }
                return bmsEndPointsObj;
            }
        }
        return undefined;
    }
    async getAttendanceControlPoint() {
        let spatialContext = (spinal_env_viewer_graph_service_1.SpinalGraphService.getContextWithType("geographicContext"))[0];
        let spatialId = spatialContext.info.id.get();
        let [building] = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(spatialId, ['hasGeographicBuilding']);
        let cp = await this.getControlPoints(building.id.get());
        return cp;
    }
    async getControlPoints(id) {
        const NODE_TO_CONTROL_POINTS_RELATION = "hasControlPoints";
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let bmsEndPointsObj = {};
        let allControlPoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(id, [NODE_TO_CONTROL_POINTS_RELATION]);
        if (allControlPoints.length != 0) {
            for (let controlPoint of allControlPoints) {
                let allBmsEndpoints = await spinal_env_viewer_graph_service_1.SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                if (allBmsEndpoints.length != 0) {
                    for (let bmsEndPoint of allBmsEndpoints) {
                        if (bmsEndPoint.name.get().toLowerCase().includes("rie"))
                            bmsEndPointsObj["RIE"] = (bmsEndPoint);
                        else if (bmsEndPoint.name.get().toLowerCase().includes("cafet"))
                            bmsEndPointsObj["CAFET"] = (bmsEndPoint);
                    }
                    return bmsEndPointsObj;
                }
            }
        }
        return undefined;
    }
    async getCapacityAttribute(id) {
        const LABEL = constants.CAPACITY_ATTRIBUTE;
        let node = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(id);
        const [attribute] = await spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, "default", LABEL);
        return attribute;
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
    async bindEndpointToControlpoint(controlPointObj, endpointObj) {
        for (let x in endpointObj) {
            if (endpointObj[x] != undefined) {
                let endpointId = endpointObj[x].id.get();
                let nodeEP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(endpointId);
                let endpointValueModel = (await nodeEP.getElement(true)).currentValue;
                let controlPointId = controlPointObj[x].id.get();
                let nodeCP = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(controlPointId);
                //bind le controlPoint aux endpoint
                endpointValueModel.bind(async () => {
                    let capacity = await this.getCapacityAttribute(controlPointId);
                    let ratio = await this.calculateRatio(endpointValueModel.get(), capacity.value);
                    console.log("current value : ", endpointValueModel.get());
                    console.log("capacity :" + capacity.value + "====> " + nodeCP.info.name.get());
                    console.log("ration :", ratio);
                    // let controlPointValue = (await nodeCP.getElement(true)).currentValue.get();
                    await this.updateControlEndpoint(controlPointId, ratio, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
                }, true);
            }
        }
    }
    async calculateRatio(value, total) {
        let result = (value / total) * 100;
        return Math.round(result * 10) / 10;
    }
}
exports.UtilsAttendance = UtilsAttendance;
//# sourceMappingURL=attendanceUtilities.js.map