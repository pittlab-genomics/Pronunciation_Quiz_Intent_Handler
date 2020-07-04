const { shuffle } = require("../common/util.js");

const cancer_list = [
    "Acute Myeloid Leukemia",
    "AML",
    "Adrenocortical carcinoma",
    "Bladder Urothelial Carcinoma",
    "Bladder Carcinoma",
    "Bladder Cancer",
    "Brain Lower Grade Glioma",
    "Lower Grade Glioma",
    "Glioma",
    "Breast invasive carcinoma",
    "Breast cancer",
    "Cervical squamous cell carcinoma and endocervical adenocarcinoma",
    "Cervical squamous cell carcinoma",
    "Endocervical adenocarcinoma",
    "Cervical carcinoma",
    "Cervical cancer",
    "Endocervical cancer",
    "Cholangiocarcinoma",
    "Bile duct cancer",
    "Chronic Myelogenous Leukemia",
    "CML",
    "Myelogenous Leukemia",
    "Colon adenocarcinoma",
    "Colon cancer",
    "Controls",
    "Esophageal carcinoma",
    "Esophageal cancer",
    "Throat cancer",
    "FFPE Pilot Phase II",
    "Glioblastoma multiforme",
    "Glioblastoma",
    "Head and Neck squamous cell carcinoma",
    "Head squamous cell carcinoma",
    "Neck squamous cell carcinoma",
    "Head carcinoma",
    "Neck carcinoma",
    "Head cancer",
    "Neck cancer",
    "Head and neck cancer",
    "Kidney Chromophobe",
    "Kidney Chromophobe cancer",
    "Chromophobe renal cell carcinoma",
    "Chromophobe renal cell cancer",
    "Kidney renal clear cell carcinoma",
    "Renal cell carcinoma",
    "Renal cell carcinoma",
    "Renal cell cancer",
    "Kidney renal papillary cell carcinoma",
    "Papillary renal cell carcinoma",
    "Papillary renal cell cancer",
    "PRCC",
    "Liver hepatocellular carcinoma",
    "Liver cancer",
    "Liver carcinoma",
    "Hepatocellular cancer",
    "Hepatocellular carcinoma",
    "HCC",
    "Lung adenocarcinoma",
    "Lung squamous cell carcinoma",
    "Lung carcinoma",
    "Lymphoid Neoplasm Diffuse Large B-cell Lymphoma",
    "Diffuse Large B-cell Lymphoma",
    "DLBCL",
    "Mesothelioma",
    "Miscellaneous",
    "Ovarian serous cystadenocarcinoma",
    "Ovarian cystadenocarcinoma",
    "Ovarian cancer",
    "Pancreatic adenocarcinoma",
    "Pancreatic cancer",
    "Pheochromocytoma and Paraganglioma",
    "Pheochromocytoma",
    "Paraganglioma",
    "Prostate adenocarcinoma",
    "Prostate cancer",
    "Rectum adenocarcinoma",
    "Rectal adenocarcinoma",
    "Rectum cancer",
    "Rectal cancer",
    "Sarcoma",
    "Skin Cutaneous Melanoma",
    "Malignant Melanoma",
    "Melanoma",
    "Skin Melanoma",
    "Skin Cancer",
    "Stomach adenocarcinoma",
    "Gastric adenocarcinoma",
    "Gastric cancer",
    "Testicular Germ Cell Tumors",
    "Testicular cancer",
    "Thymoma",
    "Thymic carcinoma",
    "Thymic cancer",
    "Thyroid carcinoma",
    "Thyroid cancer",
    "Uterine Carcinosarcoma",
    "Uterine sarcoma",
    "Uterus Carcinosarcoma",
    "Uterus sarcoma",
    "Uterine Corpus Endometrial Carcinoma",
    "Uterine Carcinoma",
    "Endometrial Carcinoma",
    "Uterine Cancer",
    "Endometrial Cancer",
    "Uterus Cancer",
    "Uveal Melanoma"
];

function get_cancer_list() {
    return cancer_list;
}

function get_rand_cancer_list(count, repeat) {
    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    const shuffled_list = shuffle(cancer_list).slice(0, N);

    // repeat each item for each session
    const rand_cancer_list = [];
    shuffled_list.forEach(function (item) {
        rand_cancer_list.push(...Array.from({ length: repeat }).map(item));
    });
    return shuffle(rand_cancer_list);
}

module.exports = {
    get_cancer_list,
    get_rand_cancer_list
};