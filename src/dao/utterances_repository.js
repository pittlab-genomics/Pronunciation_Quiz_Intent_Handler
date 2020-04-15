var AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-1" });
var _ = require('lodash');
const moment = require('moment');

const utterances_repository = function () { };
const docClient = new AWS.DynamoDB.DocumentClient();


utterances_repository.prototype.addGeneUtterance = (record) => {
    record['createdAt'] = moment().valueOf();

    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_GENE_UTTERANCES,
            Item: record
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log(`Unable to insert gene utterance => ${JSON.stringify(params)}`, err);
                return reject("Unable to insert gene utterance");
            }
            console.log(`Saved gene utterance: ${JSON.stringify(data)} | 
            TableName: ${process.env.DYNAMODB_TABLE_GENE_UTTERANCES}`);
            resolve(data);
        });
    });
}

utterances_repository.prototype.addCancerUtterance = (record) => {
    record['createdAt'] = moment().valueOf();

    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_CANCER_UTTERANCES,
            Item: record
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log(`Unable to insert cancer utterance => ${JSON.stringify(params)}`, err);
                return reject("Unable to insert cancer utterance");
            }
            console.log("Saved cancer utterance, ", JSON.stringify(data));
            resolve(data);
        });
    });
}


utterances_repository.prototype.addExpertUtterance = (record) => {
    record['createdAt'] = moment().valueOf();

    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_EXPERT_UTTERANCES,
            Item: record
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log(`Unable to insert expert utterance => ${JSON.stringify(params)}`, err);
                return reject("Unable to insert expert utterance");
            }
            console.log("Saved expert utterance, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

utterances_repository.prototype.addTestUtterance = (record) => {
    record['createdAt'] = moment().valueOf();

    return new Promise((resolve, reject) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_TEST_UTTERANCES,
            Item: record
        };
        docClient.put(params, (err, data) => {
            if (err) {
                console.log(`Unable to insert test utterance => ${JSON.stringify(params)}`, err);
                return reject("Unable to insert test utterance");
            }
            console.log(`Saved test utterance: ${JSON.stringify(data)} | 
            TableName: ${process.env.DYNAMODB_TABLE_TEST_UTTERANCES}`);
            resolve(data);
        });
    });
}

utterances_repository.prototype.getUtterancesCountGroupedByUser = async (event_params) => {
    const utterances_dict = {};
    const start = (_.has(event_params, 'start')) ? event_params['start'] : 0;
    const end = (_.has(event_params, 'end')) ? event_params['end'] : moment().endOf('day').valueOf();
    console.log(`getUtterancesCountGrouped: ${JSON.stringify(event_params)} | start: ${start}, end: ${end}`);

    const scan_params_gene = {
        TableName: process.env.DYNAMODB_TABLE_GENE_UTTERANCES,
        ProjectionExpression: "user_code, createdAt",
        FilterExpression: "#createdAt between :start and :end",
        ExpressionAttributeNames: {
            "#createdAt": "createdAt",
        },
        ExpressionAttributeValues: {
            ":start": start,
            ":end": end
        }
    };

    const scan_params_cancer = {
        TableName: process.env.DYNAMODB_TABLE_CANCER_UTTERANCES,
        ProjectionExpression: "user_code, createdAt",
        FilterExpression: "#createdAt between :start and :end",
        ExpressionAttributeNames: {
            "#createdAt": "createdAt",
        },
        ExpressionAttributeValues: {
            ":start": start,
            ":end": end
        }
    };

    let [gene_gcount, cancer_gcount] = await Promise.all([
        getGroupedCount(scan_params_gene),
        getGroupedCount(scan_params_cancer)
    ]);
    utterances_dict['gene_names'] = gene_gcount;
    utterances_dict['cancer_names'] = cancer_gcount;

    return utterances_dict;
}

utterances_repository.prototype.getFilteredGeneUtterances = async function (event_params) {
    let all_utterances_list = [];
    const start = (_.has(event_params, 'start')) ? event_params['start'] : 0;
    const end = (_.has(event_params, 'end')) ? event_params['end'] : moment().endOf('day').valueOf();
    console.log(`getFilteredGeneUtterances: ${JSON.stringify(event_params)} | start: ${start}, end: ${end}`);

    var scan_params = {
        TableName: process.env.DYNAMODB_TABLE_GENE_UTTERANCES,
        ProjectionExpression: "user_code, gene_name, utterance, createdAt",
        FilterExpression: "#createdAt between :start and :end",
        ExpressionAttributeNames: {
            "#createdAt": "createdAt",
        },
        ExpressionAttributeValues: {
            ":start": start,
            ":end": end
        }
    };

    if (_.has(event_params, 'user_code')) {
        scan_params['FilterExpression'] += ' and user_code = :ucode';
        scan_params['ExpressionAttributeValues'][':ucode'] = event_params['user_code'];
    }

    all_utterances_list = await scanEntireTable(scan_params);
    console.info(`[getAllGeneUtterances] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

utterances_repository.prototype.getUtterancesCountByGene = async function (event_params) {
    const filtered_utterances = await this.getFilteredGeneUtterances(event_params);
    return groupItemsCount(filtered_utterances, 'gene_name');
}

utterances_repository.prototype.getFilteredCancerUtterances = async function (event_params) {
    let all_utterances_list = [];
    const start = (_.has(event_params, 'start')) ? event_params['start'] : 0;
    const end = (_.has(event_params, 'end')) ? event_params['end'] : moment().endOf('day').valueOf();
    console.log(`getFilteredCancerUtterances: ${JSON.stringify(event_params)} | start: ${start}, end: ${end}`);

    var scan_params = {
        TableName: process.env.DYNAMODB_TABLE_CANCER_UTTERANCES,
        ProjectionExpression: "user_code, cancer_name, utterance, createdAt",
        FilterExpression: "#createdAt between :start and :end",
        ExpressionAttributeNames: {
            "#createdAt": "createdAt",
        },
        ExpressionAttributeValues: {
            ":start": start,
            ":end": end
        }
    };

    if (_.has(event_params, 'user_code')) {
        scan_params['FilterExpression'] += ' and user_code = :ucode';
        scan_params['ExpressionAttributeValues'][':ucode'] = event_params['user_code'];
    }

    all_utterances_list = await scanEntireTable(scan_params);
    console.info(`[getAllCancerUtterances] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

utterances_repository.prototype.getUtterancesCountByCancer = async function (event_params) {
    const filtered_utterances = await this.getFilteredCancerUtterances(event_params);
    return groupItemsCount(filtered_utterances, 'cancer_name');
}

utterances_repository.prototype.getAllGeneUtterances = async () => {
    let all_utterances_list = [];
    console.log(`Querying all gene utterances`);
    var scan_params = {
        TableName: process.env.DYNAMODB_TABLE_GENE_UTTERANCES,
        ProjectionExpression: "user_code, gene_name, utterance, createdAt",
    };

    all_utterances_list = await scanEntireTable(scan_params);
    console.info(`[getAllGeneUtterances] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

utterances_repository.prototype.getAllCancerUtterances = async () => {
    let all_utterances_list = [];
    console.log(`Querying all cancer utterances`);
    var scan_params = {
        TableName: process.env.DYNAMODB_TABLE_CANCER_UTTERANCES,
        ProjectionExpression: "user_code, cancer_name, utterance, createdAt",
    };

    all_utterances_list = await scanEntireTable(scan_params);
    console.info(`[getAllCancerUtterances] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

// used to select quiz prompts based on already attempted ones
utterances_repository.prototype.getAllGeneUtterancesByUser = async (user_code) => {
    let all_utterances_list = [];
    console.log(`Querying all gene utterances for user_code: ${user_code}`);
    var query_params = {
        TableName: process.env.DYNAMODB_TABLE_GENE_UTTERANCES,
        ProjectionExpression: "gene_name",
        KeyConditionExpression: "#user_code = :ucode",
        ExpressionAttributeNames: {
            "#user_code": "user_code"
        },
        ExpressionAttributeValues: {
            ":ucode": user_code
        }
    };

    all_utterances_list = await queryEntireTable(query_params);
    console.info(`[getAllGeneUtterancesByUser] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

/*
 * Private functions
 */

function groupItemsCount(data, attribute_name) {
    const count_dict = {};
    data.forEach(function (entry) {
        const item = entry[attribute_name];
        if (_.has(count_dict, item)) {
            count_dict[item]['utterances_count'] += 1;
        } else {
            count_dict[item] = {
                'utterances_count': 1 // initial entry for the counter
            }
        }
    });
    return count_dict;
}


async function getGroupedCount(scan_params) {
    let utterances_dict = {}
    let utterances_data = await scanEntireTable(scan_params);
    utterances_data.forEach(function (entry) {
        const user_code = parseInt(entry['user_code'], 10);
        if (_.has(utterances_dict, user_code)) {
            utterances_dict[user_code]['utterances_count'] += 1;
        } else {
            utterances_dict[user_code] = {
                'utterances_count': 1 // initial entry for the counter
            }
        }
    });
    return utterances_dict;
}

async function queryEntireTable(query_params) {
    console.debug("Querying entire table with params: ", query_params);
    let result = [];
    let hasMorePages = true;
    do {
        let data = await docClient.query(query_params).promise();

        if (data['Items'].length > 0) {
            result = [...result, ...data['Items']];
        }

        if (data.LastEvaluatedKey) {
            hasMorePages = true;
            query_params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            hasMorePages = false;
        }
    } while (hasMorePages);
    return result;
}

async function scanEntireTable(scan_params) {
    console.debug("Scanning entire table with params: ", scan_params);
    let result = [];
    let hasMorePages = true;
    do {
        let data = await docClient.scan(scan_params).promise();

        if (data['Items'].length > 0) {
            result = [...result, ...data['Items']];
        }

        if (data.LastEvaluatedKey) {
            hasMorePages = true;
            scan_params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            hasMorePages = false;
        }
    } while (hasMorePages);
    return result;
}

module.exports = new utterances_repository();