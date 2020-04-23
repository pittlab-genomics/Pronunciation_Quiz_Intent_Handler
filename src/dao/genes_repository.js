var _ = require('lodash');
const { gene_list_top_723 } = require('./genes_top_723.js');
const { gene_list_GENERIF_top50 } = require('./gene_list_GENERIF_top50.js');
const { genes_CCDS_list } = require('./genes_CCDS_list.js');
const { shuffle, groupItemsCount } = require('../common/util.js')

async function get_gene_list(gene_utterances, count, repeat) {
    // Count the number of utterances for each gene name
    let utterances_dict = groupItemsCount(gene_utterances, 'gene_name');

    // Create utterances_items out of utterances_dict array for sorting
    let utterances_items = Object.keys(utterances_dict).map(function (key) {
        return [key, utterances_dict[key]];
    });

    // Add all items in top_723 gene list (those that do not have any recordings yet)
    const genes_without_utterances = [];
    gene_list_top_723.forEach(function (top_gene) {
        if (_.isNil(utterances_dict[top_gene])) {
            genes_without_utterances.push([top_gene, 0]);
        }
    });
    const all_utterances_items = [...utterances_items, ...genes_without_utterances];

    // Sort the array based on the second element
    all_utterances_items.sort(function (first, second) {
        return first[1] - second[1];
    });

    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    let least_recorded_items = all_utterances_items.slice(0, N);
    console.log(`[get_gene_list] least_recorded_items: ${JSON.stringify(least_recorded_items)}`);

    let least_recorded_genes = shuffle(least_recorded_items.map(item => item[0]));

    // repeat each gene for each session
    const gene_list = [];
    least_recorded_genes.forEach(function (gene_name) {
        gene_list.push(...Array.from({ length: repeat }).map(x => gene_name));
    });

    return gene_list;
}

function get_rand_gene_list(count, repeat) {
    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    const shuffled_list = shuffle(gene_list_top_723).slice(0, N);
    
    // repeat each gene for each session
    const rand_gene_list = [];
    shuffled_list.forEach(function (gene_name) {
        rand_gene_list.push(...Array.from({ length: repeat }).map(x => gene_name));
    });

    return rand_gene_list;
}

async function get_generif_list(gene_utterances, count, repeat) {
    // Count the number of utterances for each gene name
    let utterances_dict = groupItemsCount(gene_utterances, 'gene_name');

    // Create utterances_items out of utterances_dict array for sorting
    let utterances_items = Object.keys(utterances_dict).map(function (key) {
        return [key, utterances_dict[key]];
    });

    // Add all items in top_723 gene list (those that do not have any recordings yet)
    const genes_without_utterances = [];
    gene_list_GENERIF_top50.forEach(function (top_gene) {
        if (_.isNil(utterances_dict[top_gene])) {
            genes_without_utterances.push([top_gene, 0]);
        }
    });
    const all_utterances_items = [...utterances_items, ...genes_without_utterances];

    // Sort the array based on the second element
    all_utterances_items.sort(function (first, second) {
        return first[1] - second[1];
    });

    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    let least_recorded_items = all_utterances_items.slice(0, N);
    console.log(`[get_gene_list] least_recorded_items: ${JSON.stringify(least_recorded_items)}`);

    let least_recorded_genes = shuffle(least_recorded_items.map(item => item[0]));

    // repeat each gene for each session
    const gene_list = [];
    least_recorded_genes.forEach(function (gene_name) {
        gene_list.push(...Array.from({ length: repeat }).map(x => gene_name));
    });

    return gene_list;
}

async function get_gene_ccds_list(gene_utterances, count, repeat) {
    // Count the number of utterances for each gene name
    let utterances_dict = groupItemsCount(gene_utterances, 'gene_name');

    // Create utterances_items out of utterances_dict array for sorting
    let utterances_items = Object.keys(utterances_dict).map(function (key) {
        return [key, utterances_dict[key]];
    });

    // Add all items in top_723 gene list (those that do not have any recordings yet)
    const genes_without_utterances = [];
    genes_CCDS_list.forEach(function (top_gene) {
        if (_.isNil(utterances_dict[top_gene])) {
            genes_without_utterances.push([top_gene, 0]);
        }
    });
    const all_utterances_items = [...utterances_items, ...genes_without_utterances];

    // Sort the array based on the second element
    all_utterances_items.sort(function (first, second) {
        return first[1] - second[1];
    });

    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    let least_recorded_items = all_utterances_items.slice(0, N);
    console.log(`[get_gene_list] least_recorded_items: ${JSON.stringify(least_recorded_items)}`);

    let least_recorded_genes = shuffle(least_recorded_items.map(item => item[0]));

    // repeat each gene for each session
    const gene_list = [];
    least_recorded_genes.forEach(function (gene_name) {
        gene_list.push(...Array.from({ length: repeat }).map(x => gene_name));
    });

    return gene_list;
}

module.exports = {
    get_gene_list,
    get_rand_gene_list,
    get_generif_list,
    get_gene_ccds_list
}