const fetch = require("@adobe/node-fetch-retry");
const URL = require("url").URL;
const { performance } = require("perf_hooks");

const { melvin_endpoint } = require("../common/config.js");
const { sign_request } = require("../utils/sigv4_utils");

const GENE_DEFAULT_MAX_DURATION = 7000;
const GENE_DEFAULT_SOCKET_TIMEOUT = 2000;
const GENE_DEFAULT_INITIAL_DELAY = 200;

const send_request_async = function (url, headers) {
    console.info(`[gene_client] gene url: ${url.href}`);
    return fetch(url, {
        headers:      headers,
        retryOptions: {
            retryMaxDuration:  GENE_DEFAULT_MAX_DURATION,
            retryInitialDelay: GENE_DEFAULT_INITIAL_DELAY,
            retryBackoff:      1.0,
            socketTimeout:     GENE_DEFAULT_SOCKET_TIMEOUT,
            onRetry:           (error) => {
                console.error(`[gene_client] gene request failed: ${JSON.stringify(error)}`);
            }
        }
    }).then(async (response) => {
        console.info(`[gene_client] gene response status: ${response.status}`);
        if (response.ok) {
            return response.json();
        } else {
            throw await response.json();
        }
    }).catch((err) => {
        throw Error(`[gene_client] gene error: ${JSON.stringify(err)}`);
    });
};

module.exports.get_gene_by_name = async function (handlerInput, params) {
    const gene_url = new URL(`${melvin_endpoint}/genes/${params.gene_name}`);
    const signed_req = await sign_request(gene_url, process.env.OOV_MAPPER_REGION, handlerInput);

    const t1 = performance.now();
    const response = await send_request_async(gene_url, signed_req.headers);
    const t2 = performance.now();
    console.info(`[gene_client] gene process took ${t2 - t1} ms, results: ${JSON.stringify(response)}`);
    return response;
};

