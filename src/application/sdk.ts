
import * as common from "../common/common.js";
import {URL} from "url";

const PREPARE_USER_APPROVAL_PATH = "/prepareUserApproval"
const GET_RECORD_INFORMATION_PATH = "/getRecordInformation"


const config = {
    operatorUrl: undefined
}

/**
 * Initializes the configuration with the provided operator URL.
 *
 * @param {string} operatorUrl - The URL of the operator to initialize the configuration with.
 * @return {void} No return value.
 */
export function setOperatorUrl(operatorUrl) {
    // check the provided url
    try {
        new URL(operatorUrl)
        // update the operator url
        config.operatorUrl = operatorUrl
    } catch (e) {
        throw new Error(`Invalid operator URL (${e}): got ${operatorUrl}`)
    }

}


/**
 * Prepares the user approval process by sending the given data to the specified endpoint.
 *
 * @param {{
 *             appLedgerId?: string,
 *             applicationId: string,
 *             version: number,
 *             fields: any,
 *             actors: {name: string, type: string}[],
 *             channels: { name: string, keyOwner: string }[],
 *             channelInvitations: Record<string, string[]>,
 *             permissions: Record<string, string[]>,
 *             author: string,
 *             approval: {
 *                 endorser: string,
 *                 message : string,
 *             }
 *         }} data - The data to be sent for preparing user approval.
 * @returns {Promise<{
 *     success: boolean,
 *     error: string,
 *     data: {dataId: string} | undefined
 * }>} A promise that resolves with the response from the endpoint.
 */
export async function sendPrepareUserApprovalToOperator(data) {
    return queryOperator(PREPARE_USER_APPROVAL_PATH, {
        applicationId: data.applicationId,
        appLedgerVirtualBlockchainId: data.appLedgerId,
        data: data
    })
}


/**
 * Fetches record information from the operator by querying a specific path.
 *
 * @param {string} dataId - The unique identifier for the data to be fetched.
 * @returns {Promise<{success: boolean, error: string, data: {virtualBlockchainId: string} | undefined}>} A promise resolving to the record information retrieved from the operator.
 */
export async function getRecordInformationFromOperator(dataId) {
    return queryOperator(GET_RECORD_INFORMATION_PATH, dataId)
}

/**
 * Sends a POST request to the specified operator URL with the provided data.
 *
 * @param {string} path - The path to query.
 * @param {Object} data - The data payload to send with the POST request.
 * @return {Promise<{success: boolean, error: string, data: any}>} A promise that resolves with the parsed JSON response from the operator.
 * @throws {Error} If the operator URL is not set in the configuration.
 */
async function queryOperator(path, data) {
    // reject if the provided operator configuration is missing
    if (config.operatorUrl === undefined) {
        throw new Error('The operator URL is missing: Please use setOperatorUrl("your url") before to query the operator')
    }
    const fullUrl = `${config.operatorUrl}${path}`;
    return new Promise(function (resolve, reject) {
        fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(async (response) => {
            console.log("Receiving data:", response)
            if (response.ok) {
                const data = await response.json()
                resolve(data)
            } else {
                reject(response.statusText)
            }
        }).catch(reject)
    });
}

// ============================================================================================================================ //
//  crc32()                                                                                                                     //
// ============================================================================================================================ //
export function crc32(arr) {
    const poly = 0xEDB88320;

    const crc32Table = [];
    function makeTable() {
        let c;



        for(let n = 0; n < 256; n++) {
            c = n;
            for(let k = 0; k < 8; k++) {
                c = c & 1 ? poly ^ (c >>> 1) : c >>> 1;
            }
            crc32Table[n] = c >>> 0;
        }
    }

    if(crc32Table.length === 0) {
        makeTable();
    }

    let crc = ~0;

    for(let i = 0; i < arr.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ arr[i]) & 0xff];
    }

    return (~crc >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

