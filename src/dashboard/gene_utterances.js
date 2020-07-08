const _ = require("lodash");
const moment = require("moment");

const utterances_repository = require("../dao/utterances_repository.js");
const { genes_CCDS_list } = require("../dao/genes_CCDS_list.js");
const { gene_list_GENERIF_top50 } = require("../dao/gene_list_GENERIF_top50.js");


exports.list_handler = async function (event) {
    console.log(`[dashboard.gene_utterances_list] event: ${JSON.stringify(event)}`);
    let response = {};
    let status_code = 200;
    const query_params = event["queryStringParameters"] || {};

    try {
        const list_name = _.get(query_params, "gene_list", "ALL");
        let all_utterances = await utterances_repository.getAllGeneUtterances();

        if (list_name === "CCDS") {
            all_utterances = all_utterances
                .filter(val => genes_CCDS_list.includes(val["gene_name"]));

        } else if (list_name === "GENERIF") {
            all_utterances = all_utterances
                .filter(val => gene_list_GENERIF_top50.includes(val["gene_name"]));
        }

        response = {
            "data": {
                "record_count": all_utterances.length,
                "records": all_utterances
            }
        };
    }
    catch (err) {
        status_code = 500;
        console.error(`[dashboard.gene_utterances_list] Exception raised: ${JSON.stringify(err)}`, err);
        response = {
            "error": "Something went wrong"
        };
    }

    return {
        "statusCode": status_code,
        "headers": { "Content-Type": "application/json" },
        "body": JSON.stringify(response, null, 4)
    };
};

function filter_genes_stats_by_list(gene_list, gene_utterances_stats) {
    gene_utterances_stats = Object.assign({}, ...
    Object.entries(gene_utterances_stats)
        .filter(([key, _ignored]) => gene_list.includes(key))
        .map(([key, val]) => ({ [key]: val }))
    );

    // Add items in gene list that do not have any recordings yet
    const genes_without_utterances = [];
    gene_list.forEach(function (item) {
        if (_.isNil(gene_utterances_stats[item])) {
            genes_without_utterances.push(item);
            gene_utterances_stats[item] = {
                "utterances_count": 0
            };
        }
    });
    return {
        "genes_without_utterances": genes_without_utterances.length,
        "gene_utterances": gene_utterances_stats
    };
}

exports.stats_handler = async function (event) {
    console.log(`[dashboard.gene_utterances_list] event: ${JSON.stringify(event)}`);
    let response = {};
    let status_code = 200;
    const query_params = event["queryStringParameters"] || {};
    const params = {};

    try {
        if (_.has(query_params, "start_date")) {
            params["start"] = moment(query_params["start_date"]).valueOf();
        }

        if (_.has(query_params, "end_date")) {
            params["end"] = moment(query_params["end_date"]).endOf("day").valueOf();
        }

        if (_.has(query_params, "start")) {
            params["start"] = parseInt(query_params["start"]);
        }

        if (_.has(query_params, "end")) {
            params["end"] = parseInt(query_params["end"]);
        }

        if (_.has(query_params, "user_code")) {
            params["user_code"] = parseInt(query_params["user_code"]);
        }

        const list_name = _.get(query_params, "gene_list", "ALL");
        let gene_utterances_stats = await utterances_repository.getUtterancesCountByGene(params);

        if (list_name === "CCDS") {
            gene_utterances_stats = filter_genes_stats_by_list(genes_CCDS_list, gene_utterances_stats);

        } else if (list_name === "GENERIF") {
            gene_utterances_stats = filter_genes_stats_by_list(gene_list_GENERIF_top50, gene_utterances_stats);

        } else {
            gene_utterances_stats = filter_genes_stats_by_list([], gene_utterances_stats);
        }

        response = {
            "data": gene_utterances_stats
        };
    }
    catch (err) {
        status_code = 500;
        console.error(`[dashboard.gene_utterances_list] Exception raised: ${JSON.stringify(err)}`, err);
        response = {
            "error": "Something went wrong"
        };
    }

    return {
        "statusCode": status_code,
        "headers": { "Content-Type": "application/json" },
        "body": JSON.stringify(response, null, 4)
    };
};

