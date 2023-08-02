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



export const WORKING_POSITION = Object.freeze({
    context: "Contexte équipement capteur",
    category: "Ubigreen"
});

export const EXCLUDE_WORKING_POSITION = Object.freeze({
    context: "Contexte d'équipement intégration",
    category: "Règle métier Ubigreen"
});


export const UBIGREEN_NETWORK = Object.freeze({
    context: "Network Ubigreen production",
    network: "SmartFlow"
});

export const CAPACITY_ATTRIBUTE = "capacity";
export const INTERVAL_TIME = 300000; //ms
export const WORKING_HOURS = Object.freeze({
    start: 7,
    end: 19
});