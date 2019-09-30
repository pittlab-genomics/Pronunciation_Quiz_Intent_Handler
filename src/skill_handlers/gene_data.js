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

function get_gene_list() {
    let gene_list = [];
    gene_list = gene_list_1.concat(gene_list_2, gene_list_3);

    gene_list = ["STAT3", "PPARG", "BRCA2"];

    return gene_list;
}

module.exports = {
    get_gene_list
}