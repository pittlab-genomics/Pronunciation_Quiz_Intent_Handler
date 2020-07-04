const { shuffle } = require("../common/util.js");

const category_list = [
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
    return category_list;
}

function get_rand_category_list(count, repeat) {
    const N = Math.floor(count / repeat);
    // Create a new array with only the first N distinct items of shuffled list
    const distinct_n_list = shuffle(category_list).slice(0, N);
    
    // repeat each item for each session
    const rand_repeated_list = []; 
    distinct_n_list.forEach(function (item) {
        rand_repeated_list.push(...Array.from({ length: repeat}).map(item));
    });
    return shuffle(rand_repeated_list);
}

module.exports = {
    get_category_list,
    get_rand_category_list,
};