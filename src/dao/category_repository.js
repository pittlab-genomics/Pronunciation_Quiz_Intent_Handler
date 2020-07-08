const _ = require("lodash");
const { shuffle, groupItemsCount } = require("../common/util.js");
const { QUIZ_CEILING_UTTERANCE_COUNT } = require("../common/config.js");

const category_target_list = [
    "mutation",
    "mutations",
    "mutated gene",
    "mutated genes",
    "insertion",
    "insertions",
    "deletion",
    "deletions",
    "indel",
    "indels",
    "SNV",
    "SNVs",
    "single nucleotide variant",
    "single nucleotide variants",
    "point mutation",
    "point mutations",
    "SNP",
    "SNPs",
    "nonsynonymous mutation",
    "nonsynonymous mutations",
    "RNA",
    "RNAs",
    "expression",
    "expressions",
    "gene expression",
    "gene expressions",
    "RNA expression",
    "RNA expressions",
    "mRNA expression",
    "mRNA expressions",
    "gain",
    "gains",
    "amplification",
    "amplifications",
    "copy number amplification",
    "copy number amplifications",
    "copy number gain",
    "copy number gains",
    "loss",
    "losses",
    "deletion",
    "deletions",
    "copy number loss",
    "copy number losses",
    "copy number deletion",
    "copy number deletions",
    "copy number",
    "copy numbers",
    "copy number change",
    "copy number changes",
    "copy number variation",
    "copy number variations",
    "copy number alteration",
    "copy number alterations",
    "SV",
    "SVs",
    "structural change",
    "structural changes",
    "structural variant",
    "structural variants",
    "domain",
    "domains",
    "most affected domain",
    "most affected domains",
    "protein domain",
    "protein domains",
    "most affected protein domain",
    "most affected protein domains",
    "clinvar",
    "The Cancer Genome Atlas",
    "TCGA",
    "Genomic Data Commons",
    "GDC",
    "Pancan Atlas",
    "Pan-cancer Atlas",
    "TCGA Pancan Atlas",
    "TCGA Pan-cancer Atlas",
    "The Cancer Genome Atlas Pancan Atlas",
    "The Cancer Genome Atlas Pan-cancer Atlas",
];

function get_category_list() {
    return category_target_list;
}

function get_rand_category_list(opts={}) {
    const count = _.get(opts, "count", category_target_list.length); 
    const repeat = _.get(opts, "repeat", 1);

    const N = Math.floor(count / repeat);
    // Create a new array with only the first N distinct items of shuffled list
    const distinct_n_list = shuffle(category_target_list).slice(0, N);
    
    // repeat each item for each session
    const rand_repeated_list = []; 
    distinct_n_list.forEach(function (item) {
        rand_repeated_list.push(...Array.from({ length: repeat }).map(_ignored => item));
    });
    return shuffle(rand_repeated_list);
}

function get_filtered_category_list(category_utterances, opts={}) {
    const count = _.get(opts, "count", category_target_list.length); 
    const repeat = _.get(opts, "repeat", 1);

    // Count the number of utterances for each category name
    let utterances_dict = groupItemsCount(category_utterances, "category_name");

    // Create utterances_items out of utterances_dict array for sorting
    let utterances_items = Object.entries(utterances_dict)
        .filter(([key, _ignored]) => category_target_list.includes(key))
        .filter(([_ignored, val]) => val < QUIZ_CEILING_UTTERANCE_COUNT)
        .map(([key, val]) => ([key, val]));

    // Add items in category list that do not have any recordings yet
    const categories_without_utterances = [];
    category_target_list.forEach(function (item) {
        if (_.isNil(utterances_dict[item])) {
            categories_without_utterances.push([item, 0]);
        }
    });
    const all_utterances_items = [...utterances_items, ...categories_without_utterances];

    // Sort the entries array in ascending order (based on utterances count - 2nd element)
    all_utterances_items.sort(function (first, second) {
        return first[1] - second[1];
    });
    console.debug(`[get_filtered_category_list] utterances_dict.len: ${Object.keys(utterances_dict).length}, `
        + `sorted all_utterances_items.len: ${JSON.stringify(all_utterances_items.length)}`);

    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    let least_recorded_items = all_utterances_items.slice(0, N);
    console.log(`[get_filtered_category_list] least_recorded_items: ${JSON.stringify(least_recorded_items)}`);

    let least_recorded_categories = least_recorded_items.map(item => item[0]);

    // repeat each category for each session
    const category_list = [];
    least_recorded_categories.forEach(function (item) {
        category_list.push(...Array.from({ length: repeat }).map(_ignored => item));
    });

    return category_list;
}

module.exports = {
    get_category_list,
    get_rand_category_list,
    get_filtered_category_list
};