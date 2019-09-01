const { baseUrl } = require('../common.js');
const request = require('request');

module.exports.post_gene_utterance = function (params) {
    var url = baseUrl + '/gene_utterances';
    var options = { json: true };

    return new Promise(function (resolve, reject) {
        request({
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            uri: url,
            body: JSON.stringify(params)
        }, function (error, response, body) {
            if (error) return reject(new Error("Error posting data to Melvin Explorer service", error));

            const data = JSON.parse(body);
            if (response.statusCode == 201) {
                console.log('Gene utterance saved: ' + JSON.stringify(data))
            } else {
                return reject(new Error("Failed to save gene utterance:" + JSON.stringify(data)));
            }
            resolve(data);
        });
    });
};

