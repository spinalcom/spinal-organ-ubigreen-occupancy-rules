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
import * as constants from "./constants"
import { NetworkService, InputDataEndpoint, InputDataEndpointDataType, InputDataEndpointType }  from "spinal-model-bmsnetwork"
import { SpinalAttribute } from "spinal-models-documentation/declarations";
import { attributeService } from "spinal-env-viewer-plugin-documentation-service";

export const networkService = new NetworkService()

export interface IBmsEndPointsObj {
    CAFET: SpinalNodeRef,
    RIE: SpinalNodeRef,
    BUILDING: SpinalNodeRef,
    AUDITORIUM: SpinalNodeRef
}

export interface IControlPointsObj {
    AFFLU_CAFET: SpinalNodeRef,
    AFFLU_RIE: SpinalNodeRef,
    OCCUP_BUILDING : SpinalNodeRef,
    OCCUP_CAFET : SpinalNodeRef,
    OCCUP_RIE : SpinalNodeRef,
    OCCUP_AUDITORIUM: SpinalNodeRef
}

/**
 * @export
 * @class UtilsAttendance
 */
 export class UtilsAttendance{
  

    /**
     * Returns a promise of IBmsEndPointsObj with the model of the right endpoints
     * @param  {string} contextName
     * @param  {string} networkName
     * @returns {Promise<IBmsEndPointsObj>} Promise
     */
    public async getUbigreenEndpoints(contextName: string,networkName: string ): Promise<IBmsEndPointsObj>{
        let bmsEndPointsObj: IBmsEndPointsObj = {   
            CAFET: undefined,
            RIE: undefined,
            BUILDING: undefined,
            AUDITORIUM: undefined
        };

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
                        bmsEndPointsObj.RIE=(bmsEndPoint);
                    }
                    else if((device.name.get().toLowerCase()).includes("cafet")){
                        let [bmsEndPoint] = await SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.CAFET=(bmsEndPoint);
                    }    
                    else if((device.name.get().toLowerCase()).includes("entree")){
                        let [bmsEndPoint] = await SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.BUILDING=(bmsEndPoint);
                    }
                    else if((device.name.get().toLowerCase()).includes("auditorium")){
                        let [bmsEndPoint] = await SpinalGraphService.getChildren(device.id.get(), ["hasBmsEndpoint"]);
                        bmsEndPointsObj.AUDITORIUM=(bmsEndPoint);
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
    private async getControlPoints(id: string): Promise<IControlPointsObj>{
        const NODE_TO_CONTROL_POINTS_RELATION = "hasControlPoints";
        const CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION = "hasBmsEndpoint";
        let controlPointsObj: IControlPointsObj = {   
            AFFLU_CAFET: undefined,
            AFFLU_RIE: undefined,
            OCCUP_BUILDING : undefined,
            OCCUP_CAFET : undefined,
            OCCUP_RIE : undefined,
            OCCUP_AUDITORIUM: undefined
        };

        let allControlPoints = await SpinalGraphService.getChildren(id, [NODE_TO_CONTROL_POINTS_RELATION]);
        if(allControlPoints.length!=0){
            for (let controlPoint of allControlPoints) {
                let allBmsEndpoints = await SpinalGraphService.getChildren(controlPoint.id.get(), [CONTROL_POINTS_TO_BMS_ENDPOINT_RELATION]);
                if(allBmsEndpoints.length!=0){
                    for (let bmsEndPoint of allBmsEndpoints) {
                        if(bmsEndPoint.name.get().toLowerCase().includes("_rie"))  controlPointsObj.AFFLU_RIE=(bmsEndPoint);
                        else if(bmsEndPoint.name.get().toLowerCase().includes("_cafet"))  controlPointsObj.AFFLU_CAFET=(bmsEndPoint);
                        else if(bmsEndPoint.name.get().toLowerCase().includes("bâtiment"))  controlPointsObj.OCCUP_BUILDING=(bmsEndPoint);
                        else if(bmsEndPoint.name.get().toLowerCase().includes(" cafétéria"))  controlPointsObj.OCCUP_CAFET=(bmsEndPoint);
                        else if(bmsEndPoint.name.get().toLowerCase().includes(" rie"))  controlPointsObj.OCCUP_RIE=(bmsEndPoint);
                        else if(bmsEndPoint.name.get().toLowerCase().includes("auditorium"))  controlPointsObj.OCCUP_AUDITORIUM=(bmsEndPoint);
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
    public async getAttendanceControlPoint(): Promise<IControlPointsObj>{
        let spatialContext = (SpinalGraphService.getContextWithType("geographicContext"))[0];
        let spatialId = spatialContext.info.id.get();
        let [building] = await SpinalGraphService.getChildren(spatialId,['hasGeographicBuilding'])
        let cp = await this.getControlPoints(building.id.get());
        return cp;
    }


    
    /**
     * Returns the capacity attribute of the node
     * @param  {string} id of the node
     * @returns {Promise<SpinalAttribute>} Promise
     */
    public async getCapacityAttribute(id: string): Promise<SpinalAttribute> {
        const LABEL = constants.CAPACITY_ATTRIBUTE;
        let node = SpinalGraphService.getRealNode(id);
        const [attribute] = await attributeService.getAttributesByCategory(node, "default",LABEL);
        return attribute;
    }



    /**
     * Function that binds to the endpoints and update the control_endpoints with the right value of attendance ratio
     * The update is applied at the first run
     * @param  {IControlPointsObj} controlPointObj
     * @param  {IBmsEndPointsObj} endpointObj
     * @returns {void} Promise
     */
    public async bindEndpointToControlpoint(controlPointObj: IControlPointsObj, endpointObj: IBmsEndPointsObj): Promise<void>{ 
        for(let x in endpointObj){
            if(endpointObj[x]!=undefined && !((x=="BUILDING") || (x=="AUDITORIUM"))){
                let endpointId = endpointObj[x].id.get();
                let nodeEP = SpinalGraphService.getRealNode(endpointId);
                let endpointValueModel = (await nodeEP.getElement(true)).currentValue;

                let controlPointId = controlPointObj["AFFLU_"+x].id.get();
                // let nodeCP = SpinalGraphService.getRealNode(controlPointId);

                //bind le controlPoint aux endpoint
                endpointValueModel.bind(async () =>{
                    let capacity = await this.getCapacityAttribute(controlPointId);
                    let ratio = this.calculateRatio(endpointValueModel.get(),Number(capacity.value));
                    let value = undefined;
                    // if(nodeCP.info.name.get().toLowerCase().includes("entree")) value = ratio;
                    // else{
                        if(ratio>=0 && ratio<=30) value="Peu fréquenté";
                        else if(ratio>30 && ratio<=55) value="Assez fréquenté";
                        else if(ratio>55 && ratio<=80) value="Très fréquenté";
                        else if(ratio>80) value="Saturé";
                    // }

                    await this.updateControlEndpoint(controlPointId,value, InputDataEndpointDataType.Real, InputDataEndpointType.Other)         

                },true);
            }
        }
    }


    
    /**
     * Calculates the attendance ration and retruns it with two digits after the decimal point
     * @param  {number} currentValue
     * @param  {number} totalCapacity
     * @returns {number} 
     */
    public calculateRatio(currentValue: number,totalCapacity:number): number{
        let result = (currentValue/totalCapacity)*100;
        return Math.round(result*100)/100;
    }


 
    /**
     * @param  {IControlPointsObj} controlPointObj
     * @param  {IBmsEndPointsObj} endpointObj
     * @returns Promise
     */
    public async calculateOccupation(controlPointObj: IControlPointsObj, endpointObj: IBmsEndPointsObj): Promise<void>{
        for(let x in endpointObj){
            if(endpointObj[x]!=undefined){
                let nodeEP = SpinalGraphService.getRealNode(endpointObj[x].id.get());
                let endpointValue = (await nodeEP.getElement(true)).currentValue.get();
                
                let controlPointId = controlPointObj["OCCUP_"+x].id.get();
                let capacity = await this.getCapacityAttribute(controlPointId);
                let ratio = this.calculateRatio(endpointValue,Number(capacity.value));
                await this.updateControlEndpoint(controlPointId,ratio, InputDataEndpointDataType.Real, InputDataEndpointType.Other);
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
            console.log(node.info.name.get() + " updated ==> value = "+ valueToPush);

        }
        else{
            console.log(valueToPush + " value to push in node : " + target.info.name.get() + " -- ABORTED !");
        }
    }




 }