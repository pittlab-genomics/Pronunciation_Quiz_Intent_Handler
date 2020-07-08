var _ = require("lodash");
const moment = require("moment");

const utterances_repository = require("../dao/utterances_repository.js");
const { user_code_names_dict } = require("../common/config.js");


exports.handler = async function (event) {
    console.log(`[dashboard.stats] event: ${JSON.stringify(event)}`);
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

        const utterances_dict = await utterances_repository.getUtterancesCountGroupedByUser(params);
        for (const [key, value] of Object.entries(user_code_names_dict)) {
            if (_.has(utterances_dict["gene_names"], key)) {
                utterances_dict["gene_names"][key]["name"] = value;
            }

            if (_.has(utterances_dict["cancer_names"], key)) {
                utterances_dict["cancer_names"][key]["name"] = value;
            }

            if (_.has(utterances_dict["category_names"], key)) {
                utterances_dict["category_names"][key]["name"] = value;
            }
        }

        let gene_count = 0;
        for (let item in utterances_dict["gene_names"]) {
            gene_count += utterances_dict["gene_names"][item]["utterances_count"];
        }

        let cancer_count = 0;
        for (let item in utterances_dict["cancer_names"]) {
            cancer_count += utterances_dict["cancer_names"][item]["utterances_count"];
        }

        let category_count = 0;
        for (let item in utterances_dict["category_names"]) {
            category_count += utterances_dict["category_names"][item]["utterances_count"];
        }

        response = {
            "data": {
                "gene_utterances": utterances_dict["gene_names"],
                "gene_utterances_count": gene_count,
                "cancer_utterances": utterances_dict["cancer_names"],
                "cancer_utterances_count": cancer_count,
                "category_utterances": utterances_dict["category_names"],
                "category_utterances_count": category_count
            }
        };
    }
    catch (err) {
        status_code = 500;
        console.error(`[dashboard.stats] Exception raised: ${JSON.stringify(err)}`, err);
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


