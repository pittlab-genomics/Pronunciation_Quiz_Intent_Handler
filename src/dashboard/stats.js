var _ = require('lodash');
const moment = require('moment');

const utterances_repository = require('../dao/utterances_repository.js');

const user_code_names_dict = {
    4525: "Jason Pitt",
    7387: "Vinay Warrier",
    81: "Stephanus Lie",
    219: "Hannan Wong",
    9727: "Akila Perera"
}


exports.handler = async function (event) {
    console.log(`[dashboard.stats] event: ${JSON.stringify(event)}`);
    let response = {};
    let status_code = 200;
    const query_params = event['queryStringParameters'] || {};
    const params = {};
    try {
        if (_.has(query_params, 'start_date')) {
            params['start'] = new Date(query_params['start_date']).valueOf();
        }

        if (_.has(query_params, 'end_date')) {            
            params['end'] = moment(query_params['end_date']).endOf('day').valueOf();
        }

        if (_.has(query_params, 'start')) {
            params['start'] = parseInt(query_params['start']);
        }

        if (_.has(query_params, 'end')) {
            params['end'] = parseInt(query_params['end']);
        }

        const utterances_dict = await utterances_repository.getUtterancesCountGrouped(params);
        for (const [key, value] of Object.entries(user_code_names_dict)) {
            if (_.has(utterances_dict, key)) {
                utterances_dict[key]['name'] = value;
            }
        }
        response = {
            'data': {
                'records': utterances_dict
            }
        }
    }
    catch (err) {
        status_code = 500;
        console.error(`[dashboard.stats] Exception raised: ${JSON.stringify(err)}`, err);
        response = {
            "error": "Something went wrong"
        }
    }

    return {
        "statusCode": status_code,
        "headers": { "Content-Type": "application/json" },
        "body": JSON.stringify(response, null, 4)
    };
}


