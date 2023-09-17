const fetch = require("@adobe/node-fetch-retry");
const URL = require("url").URL;
const { performance } = require("perf_hooks");

const {
    OOV_MAPPER_ENDPOINT, OOV_MAPPER_REGION 
} = require("../common/config.js");
const { sign_request } = require("../utils/sigv4_utils");


const OOV_DEFAULT_MAX_DURATION = 10000;
const OOV_DEFAULT_SOCKET_TIMEOUT = 5000;
const OOV_DEFAULT_INITIAL_DELAY = 200;

const send_request_async = function (url, headers) {
    console.info(`[oov_mapper_client] oov url: ${url.href}`);
    return fetch(url, {
        headers:      headers,
        retryOptions: {
            retryMaxDuration:  OOV_DEFAULT_MAX_DURATION,
            retryInitialDelay: OOV_DEFAULT_INITIAL_DELAY,
            retryBackoff:      1.0,
            socketTimeout:     OOV_DEFAULT_SOCKET_TIMEOUT,
            onRetry:           (error) => {
                console.error(`[oov_mapper_client] OOV request failed: ${JSON.stringify(error)}`);
            }
        }
    }).then(async (response) => {
        console.info(`[oov_mapper_client] OOV response status: ${response.status}`);
        if (response.ok) {
            return response.json();
        } else {
            throw await response.json();
        }
    }).catch((err) => {
        throw Error(`[oov_mapper_client] OOV error: ${JSON.stringify(err)}`);
    });
};

module.exports.get_oov_mapping_by_query = async function (handlerInput, params) {
    const oov_url = new URL(`${OOV_MAPPER_ENDPOINT}/entity_mappings`);
    oov_url.searchParams.set("query", params.query);
    const signed_req = await sign_request(oov_url, OOV_MAPPER_REGION, handlerInput);

    const t1 = performance.now();
    const response = await send_request_async(oov_url, signed_req.headers);
    const t2 = performance.now();
    console.info(`[oov_mapper_client] OOV process took ${t2 - t1} ms, results: ${JSON.stringify(response)}`);
    return response;
};

