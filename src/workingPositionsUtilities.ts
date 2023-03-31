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

import {SpinalGraphService, SpinalNodeRef} from "spinal-env-viewer-graph-service";
import {SpinalNode} from "spinal-model-graph"
import {spinalCore,Process} from "spinal-core-connectorjs_type";
import * as constants from "./constants"
import { NetworkService, InputDataEndpoint, InputDataEndpointDataType, InputDataEndpointType }  from "spinal-model-bmsnetwork"
import { SpinalAttribute } from "spinal-models-documentation/declarations";
import { attributeService, ICategory } from "spinal-env-viewer-plugin-documentation-service";

export const networkService = new NetworkService()



/**
 * @export
 * @class UtilsWorkingPositions
 */
 export class UtilsWorkingPositions{
   
    ENDPOINTS_LAST_MODIFICATION : Object;
    CONTROL_POINT_RELEASE : Object;
    DEFAULT_INTERVAL_TIME : Number;
    WORKING_HOURS: object;

    constructor() {
        this.ENDPOINTS_LAST_MODIFICATION = {};
        this.CONTROL_POINT_RELEASE = {};
        this.DEFAULT_INTERVAL_TIME = constants.INTERVAL_TIME;
        this.WORKING_HOURS = constants.WORKING_HOURS;


      }
   
    /**
     * @param  {string} contextName
     * @param  {string} categoryName
     * @returns Promise
     */
    public async getWorkPositions(contextName: string, categoryName: string): Promise<Array<SpinalNodeRef>> {
        let context = undefined;
        let category = undefined;
        //get context
        let workPositionContext = await SpinalGraphService.getContextWithType("BIMObjectGroupContext");
        workPositionContext.forEach(elt => {
            if(elt.info.name.get()==contextName) context = elt;
        });
        //get category
        let children = await SpinalGraphService.getChildren(context.info.id.get(),["hasCategory"]);
        children.forEach(elt => {
            if(elt.name.get()==categoryName) category = elt;
        });
        //get bimObjects
        let workPositions = await SpinalGraphService.findInContext(category.id.get(), context.info.id.get(), (elt:SpinalNode<any>) => {
            if(elt.info.type.get() == "BIMObject"){
                (<any>SpinalGraphService)._addNode(elt);
                return true;
            }
            return false;
        });
        // console.log("workPositions : ", workPositions);
        return workPositions;
    }





    public async getControlPoint(workpositionId: string): Promise<SpinalNodeRef>{
        const NODE_TO_CONTROL_POINTS_RELATION = "hasControlPoints";
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";

        let allControlPoints = await SpinalGraphService.getChildren(workpositionId, [NODE_TO_CONTROL_POINTS_RELATION]);
        if(allControlPoints.length!=0){
            for (let controlPoint of allControlPoints) {
                // console.log(controlPoint);
                let allBmsEndpoints = await SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                if(allBmsEndpoints.length!=0){
                    for (let bmsEndPoint of allBmsEndpoints) {
                        if(bmsEndPoint.name.get().toLowerCase() == "statut-occupation") return bmsEndPoint;
                    }
                }  
            }
        }
        // console.log("workPositions command controlPoints : ",commandControlPoint);
        return undefined;
    }




    public async getOccupancyBmsEndpoint(workPositionModel: SpinalNodeRef): Promise<SpinalNodeRef>{
        if(workPositionModel!=undefined){
            let bmsDevices = await SpinalGraphService.getChildren(workPositionModel.id.get(),["hasBmsDevice"]);
            if(bmsDevices.length!=0){
                for(let device of bmsDevices){
                    let bmsEndPoints = await SpinalGraphService.getChildren(device.id.get(),["hasBmsEndpoint"]);
                    if(bmsEndPoints.length!=0){
                        for(let bms of bmsEndPoints){
                            if(((bms.name.get()).toLowerCase()).includes("occupation")) return bms;
                        }
                    } 
                }
            }
        }
        return undefined;
    }                  
 



    public async bindEndpointToControlpoint(controlPoint: SpinalNodeRef, endpoint: SpinalNodeRef, workPositionName: string): Promise<void>{
        if(controlPoint!=undefined && endpoint!=undefined){
            let endpointId = endpoint.id.get();
            let controlPointId = controlPoint.id.get();
            let nodeEP = SpinalGraphService.getRealNode(endpointId);
            let nodeCP = SpinalGraphService.getRealNode(controlPointId);

            let endpointValueModel = (await nodeEP.getElement(true)).currentValue;

            //bind le controlPoint aux endpoint
            endpointValueModel.bind(async () =>{
                let hour = new Date().getHours();
                
                if(hour>=this.WORKING_HOURS["start"] || hour < this.WORKING_HOURS["end"]){

                
                
                    let controlPointValue = (await nodeCP.getElement(true)).currentValue.get();

                    console.log(workPositionName)
                    console.log("ep = ",endpointValueModel.get())
                    console.log("cp = ",controlPointValue)

                    await this.useCases(endpointId,endpointValueModel.get(),controlPointId,controlPointValue,workPositionName)
                //         // endpoint = 0 to 1
                // if(endpointValueModel.get()=="1" && controlPointValue =="0"){
                //     console.log("Updating << "+ workPositionName +" >>");
                //     let date = new Date().getTime();

                //     // if(Object.keys(this.ENDPOINTS_LAST_MODIFICATION).length !=0){
                //     if(this.ENDPOINTS_LAST_MODIFICATION[endpointId] != undefined){
                //         // (await nodeCP.getElement(true)).currentValue.set(endpointValueModel.get());
                //         await this.updateControlEndpoint(controlPointId, endpointValueModel.get(), InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                //         this.ENDPOINTS_LAST_MODIFICATION[endpointId] = date;
                //     }
                //     else{
                //         this.ENDPOINTS_LAST_MODIFICATION[endpointId] = date;
                //         // (await nodeCP.getElement(true)).currentValue.set(endpointValueModel.get());
                //         await this.updateControlEndpoint(controlPointId, endpointValueModel.get(), InputDataEndpointDataType.Real, InputDataEndpointType.Other);

                //     }
                    
                // }
                // // endpoint = 1 to 0
                // else if(endpointValueModel.get()=="0" && controlPointValue =="1"){
                //     console.log("Updating << "+ workPositionName +" >>");
                //     let date = new Date().getTime();
                //     let interval = this.calculateIntervalTime(endpointId,date);
                //     if(interval<5){        //last value has less than 5 minutes
                //         // (await nodeCP.getElement(true)).currentValue.set(endpointValueModel.get());
                //         await this.updateControlEndpoint(controlPointId, endpointValueModel.get(), InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                //         delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
                //     }
                //     else{
                        
                //     }
                // }
                // console.log("result :",this.ENDPOINTS_LAST_MODIFICATION);

                }
            },true);
                    
                
            
        }
    }




    public async bindControlpointToRelease(controlPoint: SpinalNodeRef, endpoint: SpinalNodeRef, workPositionName: string): Promise<void>{
        if(controlPoint!=undefined && endpoint!=undefined){
            let endpointId = endpoint.id.get();
            let controlPointId = controlPoint.id.get();
            let nodeEP = SpinalGraphService.getRealNode(endpointId)
            let nodeCP = SpinalGraphService.getRealNode(controlPointId);

            let controlPointValueModel = (await nodeCP.getElement(true)).currentValue;

            //bind le controlPoint aux endpoint
            controlPointValueModel.bind(async () =>{
                let hour = new Date().getHours();
                if(hour>=this.WORKING_HOURS["start"] || hour < this.WORKING_HOURS["end"]){
                    
                    let endpointValue = (await nodeEP.getElement(true)).currentValue.get();

                    if(controlPointValueModel.get()=="2"){
                        // await this.updateControlEndpoint(controlPointId, "1", InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                        console.log(workPositionName)
                        console.log("ep = ",endpointValue)
                        console.log("cp = ",controlPointValueModel.get())
                        await this.useCasesRelease(endpointId,endpointValue,controlPointId,controlPointValueModel.get(),workPositionName)


                    }

                }
            },false);
                    
                
            
        }
    }




    private async useCasesRelease(endpointId: string,endpointValue: string,controlPointId: string,controlPointValue: string, workPositionName:string){
        
        if(endpointValue=="0" && controlPointValue =="2"){
            await this.updateControlEndpoint(controlPointId, endpointValue, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
            delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
        }

        else if(endpointValue=="1" && controlPointValue =="2"){
            let date = new Date().getTime();
            this.CONTROL_POINT_RELEASE[endpointId] = date;
            delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
            await this.updateControlEndpoint(controlPointId, endpointValue, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
            await this.useCases(endpointId,endpointValue,controlPointId,controlPointValue,workPositionName)

            
        }


        console.log("result :",this.CONTROL_POINT_RELEASE);
    }




    private async useCases(endpointId: string,endpointValue: string,controlPointId: string,controlPointValue: string, workPositionName:string){
        // endpoint = 0 to 1
        if(endpointValue=="1" && controlPointValue =="0"){
            let date = new Date().getTime();

            this.ENDPOINTS_LAST_MODIFICATION[endpointId] = date;
            await this.updateControlEndpoint(controlPointId, endpointValue, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
            
        }

        // endpoint = 1 to 0
        else if(endpointValue=="0" && controlPointValue =="1"){
            let date = new Date().getTime();
            if(this.ENDPOINTS_LAST_MODIFICATION[endpointId] != undefined){                   //if it exists 
                let interval = this.calculateIntervalTime(this.ENDPOINTS_LAST_MODIFICATION[endpointId],date);
                if(interval<this.DEFAULT_INTERVAL_TIME){        //last value has less than 5 minutes
                    // (await nodeCP.getElement(true)).currentValue.set(endpointValueModel.get());
                    await this.updateControlEndpoint(controlPointId, endpointValue, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                    delete this.ENDPOINTS_LAST_MODIFICATION[endpointId];
                }

            }
            // release
            else if(this.CONTROL_POINT_RELEASE[endpointId] != undefined){
                let interval = this.calculateIntervalTime(this.CONTROL_POINT_RELEASE[endpointId],date);
                if(interval<this.DEFAULT_INTERVAL_TIME){        //last value has less than 5 minutes
                    await this.updateControlEndpoint(controlPointId, endpointValue, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
                    delete this.CONTROL_POINT_RELEASE[endpointId];
                }
            }
        }
        

        console.log("result-modification :",this.ENDPOINTS_LAST_MODIFICATION);
        console.log("result-relsease:",this.CONTROL_POINT_RELEASE);

    }



    private calculateIntervalTime (lastDate: number, newDate: number){
     
        let interval = newDate - lastDate;    //ms
        // let minutes = interval / 60000;     //min

        console.log("time : ",interval);
        return interval
   }
    
    

    /**
     * Function that updates a control endpoint value 
     * @param  {string} targetId - Id of the Node to update
     * @param  {any} valueToPush - The new value
     * @param  {any} dataType - Type of the data ( see InputDataEndpoint data types)
     * @param  {any} type - Type ( not really used )
     * @returns Promise
     */
    public async updateControlEndpoint(targetId:string, valueToPush:any, dataType:any, type:any): Promise<void>{
        let node = SpinalGraphService.getRealNode(targetId);
        (<any>SpinalGraphService)._addNode(node)
        let target = SpinalGraphService.getInfo(targetId);

        if(valueToPush != undefined){
            const input : InputDataEndpoint = {
                id: "",
                name: "",
                path: "",
                currentValue: valueToPush,
                unit: "",
                dataType: dataType,
                type: type,
                nodeTypeName: "BmsEndpoint"// should be SpinalBmsEndpoint.nodeTypeName || 'BmsEndpoint'
            };
            const time = new Date();
            await networkService.updateEndpoint(target,input,time);
        }
        else{
            console.log(valueToPush + " value to push in node : " + target.info.name.get() + " -- ABORTED !");
        }
    }










}