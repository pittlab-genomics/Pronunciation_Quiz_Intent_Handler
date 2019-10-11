const gene_list_1 = [
    "LAML",
    "ACC",
    "BLCA"
];

const gene_list_2 = [
    "ACC",
    "BLCA",
    "LAML"
];

const gene_list_3 = [
    "ACC",
    "BLCA",
    "LAML"
];

function get_cancer_list() {
    let cancer_list = [];
    // cancer_list = cancer_list_1.concat(cancer_list_2, cancer_list_3);
    cancer_list = cancer_list_1;
    return cancer_list;
}

module.exports = {
    get_cancer_list
}