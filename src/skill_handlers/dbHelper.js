var AWS = require("aws-sdk");
AWS.config.update({ region: "eu-west-1" });
const uuid = require('uuid');

var dbHelper = function () { };
var docClient = new AWS.DynamoDB.DocumentClient();

dbHelper.prototype.addGeneUtterance = (record) => {
    record['id'] = uuid.v4();
    record['createdAt'] = new Date().getTime();

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
            console.log("Saved gene utterance, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

dbHelper.prototype.addCancerUtterance = (record) => {
    record['id'] = uuid.v4();
    record['createdAt'] = new Date().getTime();

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


dbHelper.prototype.addExpertUtterance = (record) => {
    record['id'] = uuid.v4();
    record['createdAt'] = new Date().getTime();

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

module.exports = new dbHelper();