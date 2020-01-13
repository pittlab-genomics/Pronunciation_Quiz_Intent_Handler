var _ = require('lodash');
const dbHelper = require('./dbHelper.js');
const { gene_list_top_723 } = require('./genes_top_723.js');
const { shuffle } = require('../common/util.js')

const gene_list_1 = [
    "TP53",
    "EGFR",
    "ESR1",
    "HIF1A",
    "AKT1",
    "BRCA1",
    "ERBB2",
    "STAT3",
    "KRAS",
    "CDKN2A",
    "BRAF",
    "PPARG",
    "PTEN",
    "AR",
    "CTNNB1",
    "BRCA2",
    "CDH1",
    "MYC",
    "MTOR",
    "BCL2"
];

const gene_list_2 = [
    "STAT3",
    "KRAS",
    "CDKN2A",
    "BRAF",
    "PPARG",
    "PTEN",
    "AR",
    "TP53",
    "EGFR",
    "ESR1",
    "HIF1A",
    "AKT1",
    "BRCA1",
    "ERBB2",
    "CTNNB1",
    "BRCA2",
    "CDH1",
    "MYC",
    "MTOR",
    "BCL2"
];

const gene_list_3 = [
    "CTNNB1",
    "BRCA2",
    "CDH1",
    "MYC",
    "MTOR",
    "BCL2",
    "TP53",
    "EGFR",
    "ESR1",
    "HIF1A",
    "AKT1",
    "BRCA1",
    "ERBB2",
    "STAT3",
    "KRAS",
    "CDKN2A",
    "BRAF",
    "PPARG",
    "PTEN",
    "AR"
];

async function get_gene_list(user_code) {
    let gene_list = [];
    // gene_list = gene_list_1.concat(gene_list_2, gene_list_3);
    // gene_list = ["STAT3", "PPARG", "BRCA2"];
    // gene_list = gene_list_1;

    const gene_utterances = await dbHelper.getAllGeneUtterances(user_code);
    console.log(`user gene_utterances len: ${gene_utterances.length}`);

    let utterances_dict = {};
    gene_utterances.forEach(function (item) {
        let gene_name = item['gene_name'];
        if (_.isNil(utterances_dict[gene_name])) {
            utterances_dict[gene_name]++;
        } else {
            utterances_dict[gene_name] = 1;
        }
    });
    // console.log(`utterances_dict: ${JSON.stringify(utterances_dict)}`);

    // Create items array for sorting
    let items = Object.keys(utterances_dict).map(function (key) {
        return [key, utterances_dict[key]];
    });

    // Sort the array based on the second element
    items.sort(function (first, second) {
        return second[1] - first[1];
    });

    // Create a new array with only the first N items
    let most_recorded_items = items.slice(0, 60);
    // console.log(`most_recorded_items: ${JSON.stringify(most_recorded_items)}`);

    // filter out genes that already have high number of utterances recorded
    let filtered_gene_list = gene_list_top_723.filter((top_gene) =>
        most_recorded_items.every((most_recorded_gene) => most_recorded_gene[0] !== top_gene)
    );
    gene_list = filtered_gene_list.slice(0, 30);
    gene_list = [...gene_list, ...gene_list]; // repeat each gene twice for each session

    return shuffle(gene_list);
}

module.exports = {
    get_gene_list
}