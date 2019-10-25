const gene_list_1 = [
    "TERT",
    "MAPK1",
    "CDKN1A",
    "MDM2",
    "CCND1",
    "CXCR4",
    "JAK2",
    "PIK3CA",
    "NOTCH1",
    "HLA-A",
    "NFE2L2",
    "CD274",
    "FAS",
    "MET",
    "ATM",
    "KIT",
    "EZH2",
    "ERCC2",
    "MLH1",
    "CDKN1B"
];

const gene_list_2 = [
    "HLA-A",
    "NFE2L2",
    "MDM2",
    "CCND1",
    "CXCR4",
    "JAK2",
    "CD274",
    "FAS",
    "MET",
    "ATM",
    "KIT",
    "EZH2",
    "ERCC2",
    "MLH1",
    "CDKN1B",
    "TERT",
    "MAPK1",
    "CDKN1A",
    "PIK3CA",
    "NOTCH1"
];

const gene_list_3 = [
    "PIK3CA",
    "NOTCH1",
    "HLA-A",
    "NFE2L2",
    "EZH2",
    "ERCC2",
    "MLH1",
    "CD274",
    "FAS",
    "MET",
    "ATM",
    "TERT",
    "MAPK1",
    "CDKN1A",
    "MDM2",
    "CCND1",
    "CXCR4",
    "JAK2",
    "KIT",
    "CDKN1B"
];

function get_gene_list() {
    let gene_list = [];
    gene_list = gene_list_1.concat(gene_list_2, gene_list_3);

    // gene_list = ["STAT3", "PPARG", "BRCA2"];
    // gene_list = gene_list_1;

    return gene_list;
}

module.exports = {
    get_gene_list
}