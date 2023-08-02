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
const spinal_env_viewer_graph_service_1 = require("spinal-env-viewer-graph-service");
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const spinal_model_bmsnetwork_1 = require("spinal-model-bmsnetwork");
const cron = require("node-cron");
const config = require("../config");
const ConfigFile_js_1 = require("../node_modules/spinal-lib-organ-monitoring/dist/classes/ConfigFile.js");
const constants = require("./constants");
const workingPositionsUtilities_1 = require("./workingPositionsUtilities");
const attendanceUtilities_1 = require("./attendanceUtilities");
const utils_workingPositions = new workingPositionsUtilities_1.UtilsWorkingPositions();
const utils_attendance = new attendanceUtilities_1.UtilsAttendance();
// Cette fonction est executée en cas de deconnexion au hub
spinal_core_connectorjs_type_1.FileSystem.onConnectionError = (error_code) => {
    setTimeout(() => {
        console.log('STOP ERROR');
        process.exit(error_code); // kill le process;
    }, 5000);
};
class SpinalMain {
    constructor() {
        const url = `${config.hubProtocol}://${config.userId}:${config.userPassword}@${config.hubHost}:${config.hubPort}/`;
        this.connect = spinal_core_connectorjs_type_1.spinalCore.connect(url);
        this.stopTime = constants.WORKING_HOURS.end;
    }
    /**
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    init() {
        return new Promise((resolve, reject) => {
            spinal_core_connectorjs_type_1.spinalCore.load(this.connect, config.digitalTwinPath, async (graph) => {
                await spinal_env_viewer_graph_service_1.SpinalGraphService.setGraph(graph);
                console.log("Connected to the hub");
                ConfigFile_js_1.default.init(this.connect, process.env.ORGAN_NAME + "-config", process.env.HUB_HOST, process.env.HUB_PROTOCOL, parseInt(process.env.HUB_PORT));
                resolve(graph);
            }, () => {
                reject();
            });
        });
    }
    /**
     * The main function of the class
     * @returns Promise
     */
    async MainJob() {
        await this.analysingWorkingPosition();
        await this.analysingAttendance();
    }
    /**
     * Calculates the attendance ratio
     * @returns Promise
     */
    async analysingAttendance() {
        const contextName = constants.UBIGREEN_NETWORK.context;
        const networkName = constants.UBIGREEN_NETWORK.network;
        console.log(" START ANALYSING ATTENDANCE ..... ");
        let ep = await utils_attendance.getUbigreenEndpoints(contextName, networkName);
        let cp = await utils_attendance.getAttendanceControlPoint();
        await utils_attendance.bindEndpointToControlpoint(cp, ep);
        console.log("** DONE ANALYSING ATTENDANCE **");
    }
    /**
     * Calculates the occupation ratio
     * @returns Promise
     */
    async buldingOccupation() {
        const contextName = constants.UBIGREEN_NETWORK.context;
        const networkName = constants.UBIGREEN_NETWORK.network;
        let ep = await utils_attendance.getUbigreenEndpoints(contextName, networkName);
        let cp = await utils_attendance.getAttendanceControlPoint();
        await utils_attendance.calculateOccupation(cp, ep);
        console.log("** DONE calculating building occupation indicators **");
    }
    /**
     * Analyse the occupancy of all working positions
     * @returns Promise
     */
    async analysingWorkingPosition() {
        const workPositionContextName = constants.WORKING_POSITION.context;
        const workPositionCategoryName = constants.WORKING_POSITION.category;
        const RQTHworkPositionContextName = constants.EXCLUDE_WORKING_POSITION.context;
        const RQTHworkPositionCategoryName = constants.EXCLUDE_WORKING_POSITION.category;
        console.log(" START ANALYSING WORKING POSITIONS ..... ");
        let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName, workPositionCategoryName);
        let RQTHworkingPositions = await utils_workingPositions.getWorkPositions(RQTHworkPositionContextName, RQTHworkPositionCategoryName);
        let finalWP = {};
        for (let elt of workingPositions) {
            if (elt != undefined)
                finalWP[elt.id.get()] = "ok";
        }
        for (let exclude of RQTHworkingPositions) {
            if (exclude != undefined)
                delete finalWP[exclude.id.get()];
        }
        let listWP = Object.keys(finalWP);
        let promises = listWP.map(async (posId) => {
            let posNode = spinal_env_viewer_graph_service_1.SpinalGraphService.getRealNode(posId);
            let cp = await utils_workingPositions.getControlPoint(posId);
            let ep = await utils_workingPositions.getOccupancyBmsEndpoint(posId);
            await utils_workingPositions.bindEndpointToControlpoint(cp, ep, posNode);
            await utils_workingPositions.bindControlpointToRelease(cp, ep, posNode);
        });
        await Promise.all(promises);
        console.log("** DONE ANALYSING WORKING POSITIONS **");
    }
    /**
     * Reset all working positions at 19h
     * @returns Promise
     */
    async ReleaseJob() {
        const workPositionContextName = constants.WORKING_POSITION.context;
        const workPositionCategoryName = constants.WORKING_POSITION.category;
        const RQTHworkPositionContextName = constants.EXCLUDE_WORKING_POSITION.context;
        const RQTHworkPositionCategoryName = constants.EXCLUDE_WORKING_POSITION.category;
        let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName, workPositionCategoryName);
        let RQTHworkingPositions = await utils_workingPositions.getWorkPositions(RQTHworkPositionContextName, RQTHworkPositionCategoryName);
        let finalWP = {};
        for (let elt of workingPositions) {
            if (elt != undefined)
                finalWP[elt.id.get()] = "ok";
        }
        for (let exclude of RQTHworkingPositions) {
            if (exclude != undefined)
                delete finalWP[exclude.id.get()];
        }
        let listWP = Object.keys(finalWP);
        let promises = listWP.map(async (posId) => {
            let cp = await utils_workingPositions.getControlPoint(posId);
            await utils_workingPositions.updateControlEndpoint(cp.id.get(), 0, spinal_model_bmsnetwork_1.InputDataEndpointDataType.Real, spinal_model_bmsnetwork_1.InputDataEndpointType.Other);
        });
        await Promise.all(promises);
        console.log("** DONE RESETING WORKING POSITIONS **");
    }
}
async function Main() {
    try {
        console.log('Organ Start');
        const spinalMain = new SpinalMain();
        await spinalMain.init();
        await spinalMain.MainJob();
        //Release working positions occupancy at a specific time
        cron.schedule(`0 ${spinalMain.stopTime} * * *`, async () => {
            console.log(`*** It's ${spinalMain.stopTime}h - Organ is stopped  ***`);
            await spinalMain.ReleaseJob();
        });
        //calculating building occupation indicators every hour
        cron.schedule(`0 * * * *`, async () => {
            console.log(`*** Calculating building occupation indicators ***`);
            await spinalMain.buldingOccupation();
        });
    }
    catch (error) {
        console.error(error);
        setTimeout(() => {
            console.log('STOP ERROR');
            process.exit(0);
        }, 5000);
    }
}
// Call main function
Main();
//# sourceMappingURL=index.js.map