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

import {SpinalGraphService,SpinalNodeRef} from "spinal-env-viewer-graph-service";
import {spinalCore,Process, FileSystem} from "spinal-core-connectorjs_type";
import {InputDataEndpointDataType, InputDataEndpointType }  from "spinal-model-bmsnetwork"
import cron = require('node-cron');
import * as config from "../config";
import ConfigFile from "../node_modules/spinal-lib-organ-monitoring/dist/classes/ConfigFile.js"
import * as constants from "./constants"
import {UtilsWorkingPositions} from "./workingPositionsUtilities"
import {UtilsAttendance} from "./attendanceUtilities"

const utils_workingPositions = new UtilsWorkingPositions();
const utils_attendance = new UtilsAttendance();

// Cette fonction est executée en cas de deconnexion au hub
FileSystem.onConnectionError = (error_code: number) => {
    setTimeout(() => {
        console.log('STOP ERROR');
        process.exit(error_code); // kill le process;
    }, 5000);
}


class SpinalMain {


    connect: spinal.FileSystem;
    constructor() { 
        const url = `${config.hubProtocol}://${config.userId}:${config.userPassword}@${config.hubHost}:${config.hubPort}/`;
        this.connect = spinalCore.connect(url)
    }
    

    /**
     * Initialize connection with the hub and load graph
     * @return {*}
     * @memberof SpinalMain
     */
    public init() {
        return new Promise((resolve, reject) => {
            spinalCore.load(this.connect, config.digitalTwinPath, async (graph: any) => {
                await SpinalGraphService.setGraph(graph);
                console.log("Connected to the hub");
                ConfigFile.init(this.connect, process.env.ORGAN_NAME + "-config", process.env.HUB_HOST, process.env.HUB_PROTOCOL, parseInt(process.env.HUB_PORT));
                resolve(graph);
            }, () => {
                reject()
            })
        });

    }


  
    /**
     * The main function of the class
     * @returns Promise
     */
    public async MainJob(): Promise<void> {
        await this.analysingWorkingPosition();
        await this.analysingAttendance();
    }
   


    /**
     * Calculates the attendance ratio
     * @returns Promise
     */
    private async analysingAttendance(): Promise<void>{
        const contextName = constants.UBIGREEN_NETWORK.context;
        const networkName = constants.UBIGREEN_NETWORK.network;
        console.log(" START ANALYSING ATTENDANCE ..... ");

        let ep = await utils_attendance.getUbigreenEndpoints(contextName,networkName);
        let cp = await utils_attendance.getAttendanceControlPoint();
        await utils_attendance.bindEndpointToControlpoint(cp,ep);

        console.log("** DONE ANALYSING ATTENDANCE **");
    }


    
    /**
     * Analyse the occupancy of all working positions
     * @returns Promise
     */
    private async analysingWorkingPosition(): Promise<void>{
        const workPositionContextName = constants.WORKING_POSITION.context;
        const workPositionCategoryName = constants.WORKING_POSITION.category;
        console.log(" START ANALYSING WORKING POSITIONS ..... ");

        let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName,workPositionCategoryName);

        let promises = workingPositions.map(async (pos: SpinalNodeRef) =>{
            let cp = await utils_workingPositions.getControlPoint(pos.id.get());
            let ep = await utils_workingPositions.getOccupancyBmsEndpoint(pos);

            await utils_workingPositions.bindEndpointToControlpoint(cp,ep,pos.name.get());
            await utils_workingPositions.bindControlpointToRelease(cp,ep,pos.name.get());

        });
        await Promise.all(promises);

        console.log("** DONE ANALYSING WORKING POSITIONS **");
    }



    /**
     * Reset all working positions at 19h
     * @returns Promise
     */
    public async ReleaseJob(): Promise<void> {
        const workPositionContextName = constants.WORKING_POSITION.context;
        const workPositionCategoryName = constants.WORKING_POSITION.category;

        let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName,workPositionCategoryName);
        let promises = workingPositions.map(async (pos: SpinalNodeRef) =>{
            let cp = await utils_workingPositions.getControlPoint(pos.id.get());
            await utils_workingPositions.updateControlEndpoint(cp.id.get(),0,InputDataEndpointDataType.Real, InputDataEndpointType.Other)

        });
        await Promise.all(promises);

        console.log("** DONE RESETING WORKING POSITIONS **");
    }



}





async function Main(): Promise<void> {
    try {
        console.log('Organ Start');
        const spinalMain = new SpinalMain();
        await spinalMain.init();
        await spinalMain.MainJob();
        
        cron.schedule('0 19 * * *', async (): Promise<void> => {
            console.log(`*** It's 19h - Organ is stopped  ***`);
            await spinalMain.ReleaseJob();
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
Main()