const _ = require('lodash');
const moment = require('moment');

const utterances_repository = require('../dao/utterances_repository.js');


exports.list_handler = async function (event) {
    console.log(`[dashboard.cancer_utterances_list] event: ${JSON.stringify(event)}`);
    let response = {};
    let status_code = 200;
    try {
        const all_utterances = await utterances_repository.getAllCancerUtterances();
        response = {
            'data': {
                'record_count': all_utterances.length,
                'records': all_utterances
            }
        }
    }
    catch (err) {
        status_code = 500;
        console.error(`[dashboard.cancer_utterances_list] Exception raised: ${JSON.stringify(err)}`, err);
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


exports.stats_handler = async function (event) {
    console.log(`[dashboard.cancer_utterances_list] event: ${JSON.stringify(event)}`);
    let response = {};
    let status_code = 200;
    const query_params = event['queryStringParameters'] || {};
    const params = {};

    try {
        if (_.has(query_params, 'start_date')) {
            params['start'] = moment(query_params['start_date']).valueOf();
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

        if (_.has(query_params, 'user_code')) {
            params['user_code'] = parseInt(query_params['user_code']);
        }

        const cancer_utterances_stats = await utterances_repository.getUtterancesCountByCancer(params);
        response = {
            'data': cancer_utterances_stats
        }
    }
    catch (err) {
        status_code = 500;
        console.error(`[dashboard.cancer_utterances_list] Exception raised: ${JSON.stringify(err)}`, err);
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

