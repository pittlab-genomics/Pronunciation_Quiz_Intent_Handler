const utterances_repository = require('../dao/utterances_repository.js');

exports.handler = async function (event) {
    console.log(`[dashboard.gene_utterances_list] event: ${JSON.stringify(event)}`);
    let response = {};
    let status_code = 200;
    try {
        const all_utterances = await utterances_repository.getAllGeneUtterances();
        response = {
            'data': {
                'record_count': all_utterances.length,
                'records': all_utterances
            }
        }
    }
    catch (err) {
        status_code = 500;
        console.log(`[dashboard.gene_utterances_list] Exception raised: ${JSON.stringify(err)}`);
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


