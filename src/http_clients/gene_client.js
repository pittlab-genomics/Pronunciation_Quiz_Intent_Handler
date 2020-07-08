const { melvin_endpoint } = require("../common/config.js");
const https = require("request");
const URL = require("url").URL;

module.exports.get_gene_by_name = function (params) {
    const genes_url = new URL(`${melvin_endpoint}/genes/${params.gene_name}`);
    var options = { json: true };

    return new Promise(function (resolve, reject) {
        https(genes_url.href, options, function (error, response, body) {
            // in addition to parsing the value, deal with possible errors
            if (error) return reject(new Error("Error retrieving data from Melvin Explorer service", error));

            if (response.statusCode >= 500 && response.statusCode <= 599) {
                return reject(new Error("Error retrieving data from Melvin Explorer service."
                    + ` Invalid response.statusCode: ${response.statusCode}`));
            }

            console.log("API RESPONSE = [url] " + genes_url.href + ", [body] " + JSON.stringify(body));
            resolve(body);

        });
    });
};

