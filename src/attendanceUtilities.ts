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
 * @class UtilsAttendance
 */
 export class UtilsAttendance{

    public async getUbigreenEndpoints(contextName: string,networkName: string ){
        let bmsEndPointsObj = {};

        let networkContext = (SpinalGraphService.getContext(contextName));
        let contextId = networkContext.info.id.get();
        let [network]= await SpinalGraphService.findInContext(contextId,contextId,(elt:SpinalNode<any>) => {
            if(elt.info.type.get() == "BmsNetwork" && (elt.info.name.get() == networkName)){
                (<any>SpinalGraphService)._addNode(elt);
                return true;
            }
            return false;
        });


        if(network != undefined){
            let devices = await SpinalGraphService.getChildren(network.id.get(), ["hasBmsDevice"]);

            if(devices.length!=0){
                for (let device of devices) {
                    if((device.name.get().toLowerCase()).includes("rie")){
                        let [bmsEndPoint] = await SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj["RIE"]=(bmsEndPoint);
                    }
                    else if((device.name.get().toLowerCase()).includes("cafet")){
                        let [bmsEndPoint] = await SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj["CAFET"]=(bmsEndPoint);
                    }    
                }
                return bmsEndPointsObj;
            }  
        }
        return undefined;
    }



    public async getAttendanceControlPoint(): Promise<object>{
        let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
        let spatialId = spatialContext.info.id.get();
        let [building] = await SpinalGraphService.getChildren(spatialId,['hasGeographicBuilding'])
        let cp = await this.getControlPoints(building.id.get());
        return cp;

    }



    private async getControlPoints(id: string): Promise<object>{
        const NODE_TO_CONTROL_POINTS_RELATION = "hasControlPoints";
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let bmsEndPointsObj = {};

        let allControlPoints = await SpinalGraphService.getChildren(id, [NODE_TO_CONTROL_POINTS_RELATION]);
        if(allControlPoints.length!=0){
            for (let controlPoint of allControlPoints) {
                let allBmsEndpoints = await SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                if(allBmsEndpoints.length!=0){
                    for (let bmsEndPoint of allBmsEndpoints) {
                        if(bmsEndPoint.name.get().toLowerCase().includes("rie"))  bmsEndPointsObj["RIE"]=(bmsEndPoint);
                        else if(bmsEndPoint.name.get().toLowerCase().includes("cafet"))  bmsEndPointsObj["CAFET"]=(bmsEndPoint);

                    }
                    return bmsEndPointsObj;
                }  
            }
        }
        return undefined;
    }

    
    private async getCapacityAttribute(id: string): Promise<SpinalAttribute> {
        const LABEL = constants.CAPACITY_ATTRIBUTE;
        let node = SpinalGraphService.getRealNode(id);
        const [attribute] = await attributeService.getAttributesByCategory(node, "default",LABEL);
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
     private async updateControlEndpoint(targetId:string, valueToPush:any, dataType:any, type:any): Promise<void>{
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


    public async bindEndpointToControlpoint(controlPointObj: object, endpointObj: object): Promise<void>{
        for(let x in endpointObj){
            if(endpointObj[x]!=undefined){
                let endpointId = endpointObj[x].id.get();
                let nodeEP = SpinalGraphService.getRealNode(endpointId);
                let endpointValueModel = (await nodeEP.getElement(true)).currentValue;

                let controlPointId = controlPointObj[x].id.get();
                let nodeCP = SpinalGraphService.getRealNode(controlPointId);

                //bind le controlPoint aux endpoint
                endpointValueModel.bind(async () =>{
                    let capacity = await this.getCapacityAttribute(controlPointId);
                    let ratio = await this.calculateRatio(endpointValueModel.get(),capacity.value);
                    console.log("current value : ",endpointValueModel.get() );
                    
                    console.log("capacity :" + capacity.value + "====> " + nodeCP.info.name.get());
                    console.log("ration :", ratio);

                    await this.updateControlEndpoint(controlPointId,ratio, InputDataEndpointDataType.Real, InputDataEndpointType.Other)
    

                    
                },true);

            }
        }
         
            
    }



    private async calculateRatio(value: number,total:any){
        let result = (value/total)*100;
        return Math.round(result*100)/100;
        
    }
 }