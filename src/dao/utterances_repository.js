var AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-1" });
var _ = require('lodash');
const moment = require('moment');

var utterances_repository = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();


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

utterances_repository.prototype.getUtterancesCountGrouped = async (event_params) => {
    const utterances_dict = {};
    const start = (_.has(event_params, 'start')) ? event_params['start'] : 0;
    const end = (_.has(event_params, 'end')) ? event_params['end'] : moment().endOf('day').valueOf();
    console.log(`getUtterancesCountGrouped: ${JSON.stringify(event_params)} | start: ${start}, end: ${end}`);

    const scan_params = {
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

    let hasMorePages = true;
    do {
        let data = await docClient.scan(scan_params).promise();

        if (data['Items'].length > 0) {
            data['Items'].forEach(function (entry) {
                const user_code = parseInt(entry['user_code'], 10);
                if (_.has(utterances_dict, user_code)) {
                    utterances_dict[user_code]['utterances_count'] += 1;
                } else {
                    utterances_dict[user_code] = {
                        'utterances_count': 1
                    }
                }
            });
        }

        if (data.LastEvaluatedKey) {
            hasMorePages = true;
            scan_params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            hasMorePages = false;
        }
    } while (hasMorePages);

    return utterances_dict;
}

utterances_repository.prototype.getFilteredGeneUtterances = async (event_params) => {
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

    let hasMorePages = true;
    do {
        let data = await docClient.scan(scan_params).promise();

        if (data['Items'].length > 0) {
            all_utterances_list = [...all_utterances_list, ...data['Items']];
        }

        if (data.LastEvaluatedKey) {
            hasMorePages = true;
            scan_params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            hasMorePages = false;
        }
    } while (hasMorePages);

    console.info(`[getAllGeneUtterances] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

utterances_repository.prototype.getAllGeneUtterances = async () => {
    let all_utterances_list = [];
    console.log(`Querying all gene utterances`);
    var scan_params = {
        TableName: process.env.DYNAMODB_TABLE_GENE_UTTERANCES,
        ProjectionExpression: "user_code, gene_name, utterance, createdAt",
    };

    let hasMorePages = true;
    do {
        let data = await docClient.scan(scan_params).promise();

        if (data['Items'].length > 0) {
            all_utterances_list = [...all_utterances_list, ...data['Items']];
        }

        if (data.LastEvaluatedKey) {
            hasMorePages = true;
            scan_params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            hasMorePages = false;
        }
    } while (hasMorePages);

    console.info(`[getAllGeneUtterances] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

utterances_repository.prototype.getAllGeneUtterancesByUser = async (user_code) => {
    let all_utterances_list = [];
    console.log(`Querying all gene utterances for user_code: ${user_code}`);
    var scan_params = {
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

    let hasMorePages = true;
    do {
        let data = await docClient.query(scan_params).promise();

        if (data['Items'].length > 0) {
            all_utterances_list = [...all_utterances_list, ...data['Items']];
        }

        if (data.LastEvaluatedKey) {
            hasMorePages = true;
            scan_params.ExclusiveStartKey = data.LastEvaluatedKey;
        } else {
            hasMorePages = false;
        }
    } while (hasMorePages);

    console.info(`[getAllGeneUtterancesByUser] dataset length: ${all_utterances_list.length}`)
    return all_utterances_list;
}

module.exports = new utterances_repository();