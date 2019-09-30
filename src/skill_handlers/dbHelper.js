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
                console.log(`Unable to insert => ${JSON.stringify(params)}`, err);
                return reject("Unable to insert");
            }
            console.log("Saved Data, ", JSON.stringify(data));
            resolve(data);
        });
    });
}

module.exports = new dbHelper();