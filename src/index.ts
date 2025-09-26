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
import {spinalCore,Process, FileSystem, Val} from "spinal-core-connectorjs_type";
import {InputDataEndpointDataType, InputDataEndpointType }  from "spinal-model-bmsnetwork"
import cron = require('node-cron');
import * as config from "../config";
import ConfigFile from 'spinal-lib-organ-monitoring';
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

    // stopTime : Number;
    WORKING_HOURS : Object;
    connect: spinal.FileSystem;
    constructor() { 
        const url = `${config.hubProtocol}://${config.userId}:${config.userPassword}@${config.hubHost}/`;
        this.connect = spinalCore.connect(url);
        // this.stopTime = constants.WORKING_HOURS.end;
        this.WORKING_HOURS = constants.WORKING_HOURS;
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
                ConfigFile.init(this.connect, process.env.ORGAN_NAME,process.env.ORGAN_TYPE, process.env.HUB_HOST, parseInt(process.env.HUB_PORT));
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
     * Calculates the occupation ratio
     * @returns Promise
     */
    public async buldingOccupation(): Promise<void>{
        const contextName = constants.UBIGREEN_NETWORK.context;
        const networkName = constants.UBIGREEN_NETWORK.network;

        let ep = await utils_attendance.getUbigreenEndpoints(contextName,networkName);
        let cp = await utils_attendance.getAttendanceControlPoint();
        await utils_attendance.calculateOccupation(cp,ep);
        console.log("** DONE calculating building occupation indicators **");
    }
    
    
    /**
     * Analyse the occupancy of all working positions
     * @returns Promise
     */
    private async analysingWorkingPosition(): Promise<void>{
        const workPositionContextName = constants.WORKING_POSITION.context;
        const workPositionCategoryName = constants.WORKING_POSITION.category;
        const RQTHworkPositionContextName = constants.EXCLUDE_WORKING_POSITION.context;
        const RQTHworkPositionCategoryName = constants.EXCLUDE_WORKING_POSITION.category;
        console.log(" START ANALYSING WORKING POSITIONS ..... ");

        let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName,workPositionCategoryName);
        let RQTHworkingPositions = await utils_workingPositions.getWorkPositions(RQTHworkPositionContextName,RQTHworkPositionCategoryName);

        let finalWP = {}
        for(let elt of workingPositions){
            if(elt != undefined) finalWP[elt.id.get()] = "ok";
        } 
        for(let exclude of RQTHworkingPositions){
            if(exclude != undefined) delete finalWP[exclude.id.get()];
        } 
        let listWP = Object.keys(finalWP)

        let promises = listWP.map(async (posId) =>{
            let posNode = SpinalGraphService.getRealNode(posId);
            let cp = await utils_workingPositions.getControlPoint(posId);
            let ep = await utils_workingPositions.getOccupancyBmsEndpoint(posId);

            await utils_workingPositions.bindEndpointToControlpoint(cp,ep,posNode);
            await utils_workingPositions.bindControlpointToRelease(cp,ep,posNode);

        });
        await Promise.all(promises);

        console.log("** DONE ANALYSING WORKING POSITIONS **");
    }



        /**
     * Analyse the occupancy of all working positions
     * @returns Promise
     */
        public async ReleaseUnoccupiedPositions(): Promise<void>{
            const workPositionContextName = constants.WORKING_POSITION.context;
            const workPositionCategoryName = constants.WORKING_POSITION.category;
            const RQTHworkPositionContextName = constants.EXCLUDE_WORKING_POSITION.context;
            const RQTHworkPositionCategoryName = constants.EXCLUDE_WORKING_POSITION.category;
    
            let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName,workPositionCategoryName);
            let RQTHworkingPositions = await utils_workingPositions.getWorkPositions(RQTHworkPositionContextName,RQTHworkPositionCategoryName);
    
            let finalWP = {}
            for(let elt of workingPositions){
                if(elt != undefined) finalWP[elt.id.get()] = "ok";
            } 
            for(let exclude of RQTHworkingPositions){
                if(exclude != undefined) delete finalWP[exclude.id.get()];
            } 
            let listWP = Object.keys(finalWP)
    
            let promises = listWP.map(async (posId) =>{
                let cp = await utils_workingPositions.getControlPoint(posId);
                let ep = await utils_workingPositions.getOccupancyBmsEndpoint(posId);
    
                let nodeEP = SpinalGraphService.getRealNode(ep.id.get());
                let endpointValue = (await nodeEP.getElement(true)).currentValue.get()
                if(endpointValue==0) await utils_workingPositions.updateControlEndpoint(cp.id.get(),0,InputDataEndpointDataType.Real, InputDataEndpointType.Other);
    
            });
            await Promise.all(promises);
    
            console.log("** DONE RESETING UNOCCUPIED WORKING POSITIONS **");
        }


    /**
     * Reset all working positions at 19h
     * @returns Promise
     */
    public async ReleaseAllPositions(): Promise<void> {
        const workPositionContextName = constants.WORKING_POSITION.context;
        const workPositionCategoryName = constants.WORKING_POSITION.category;
        const RQTHworkPositionContextName = constants.EXCLUDE_WORKING_POSITION.context;
        const RQTHworkPositionCategoryName = constants.EXCLUDE_WORKING_POSITION.category;

        let workingPositions = await utils_workingPositions.getWorkPositions(workPositionContextName,workPositionCategoryName);
        let RQTHworkingPositions = await utils_workingPositions.getWorkPositions(RQTHworkPositionContextName,RQTHworkPositionCategoryName);

        let finalWP = {}
        for(let elt of workingPositions){
            if(elt != undefined) finalWP[elt.id.get()] = "ok";
        } 
        for(let exclude of RQTHworkingPositions){
            if(exclude != undefined) delete finalWP[exclude.id.get()];
        } 
        let listWP = Object.keys(finalWP)
        let promises = listWP.map(async (posId: string) =>{
            let cp = await utils_workingPositions.getControlPoint(posId);
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

        //Release unoccupied working positions occupancy at a specific time
        cron.schedule(`0 ${spinalMain.WORKING_HOURS["mid"]} * * *`, async (): Promise<void> => {
            console.log(`*** It's ${spinalMain.WORKING_HOURS["mid"]}h - Releasing unoccupied working positions ***`);
            await spinalMain.ReleaseUnoccupiedPositions();
        });

        //Release all working positions occupancy at the end of the day
        cron.schedule(`0 ${spinalMain.WORKING_HOURS["end"]} * * *`, async (): Promise<void> => {
            console.log(`*** It's ${spinalMain.WORKING_HOURS["end"]}h - Organ is stopped  ***`);
            await spinalMain.ReleaseAllPositions();
        });

        //calculating building occupation indicators every hour
        cron.schedule(`0 * * * *`, async (): Promise<void> => {
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
Main()