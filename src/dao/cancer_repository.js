const _ = require("lodash");
const {
    shuffle, groupItemsCount 
} = require("../common/util.js");
const { QUIZ_CEILING_UTTERANCE_COUNT } = require("../common/config.js");

const cancer_target_list = [
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
    return cancer_target_list;
}

function get_rand_cancer_list(opts={}) {
    const count = _.get(opts, "count", cancer_target_list.length); 
    const repeat = _.get(opts, "repeat", 1);

    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    const shuffled_list = shuffle(cancer_target_list).slice(0, N);

    // repeat each item for each session
    const rand_cancer_list = [];
    shuffled_list.forEach(function (item) {
        rand_cancer_list.push(...Array.from({ length: repeat }).map(_ignored => item));
    });
    return shuffle(rand_cancer_list);
}

function get_filtered_cancer_list(cancer_utterances, opts={}) {
    const count = _.get(opts, "count", cancer_target_list.length); 
    const repeat = _.get(opts, "repeat", 1);

    // Count the number of utterances for each cancer name
    let utterances_dict = groupItemsCount(cancer_utterances, "cancer_name");

    // Create utterances_items out of utterances_dict array for sorting
    let utterances_items = Object.entries(utterances_dict)
        .filter(([key, _ignored]) => cancer_target_list.includes(key))
        .filter(([_ignored, val]) => val < QUIZ_CEILING_UTTERANCE_COUNT)
        .map(([key, val]) => ([key, val]));

    // Add items in cancer list that do not have any recordings yet
    const cancers_without_utterances = [];
    cancer_target_list.forEach(function (item) {
        if (_.isNil(utterances_dict[item])) {
            cancers_without_utterances.push([item, 0]);
        }
    });
    const all_utterances_items = [...utterances_items, ...cancers_without_utterances];

    // Sort the entries array in ascending order (based on utterances count - 2nd element)
    all_utterances_items.sort(function (first, second) {
        return first[1] - second[1];
    });
    console.debug(`[get_filtered_cancer_list] utterances_dict.len: ${Object.keys(utterances_dict).length}, `
        + `sorted all_utterances_items.len: ${JSON.stringify(all_utterances_items.length)}`);

    // Create a new array with only the first N distinct items
    const N = Math.floor(count / repeat);
    let least_recorded_items = all_utterances_items.slice(0, N);
    console.log(`[get_filtered_cancer_list] least_recorded_items: ${JSON.stringify(least_recorded_items)}`);

    let least_recorded_cancers = least_recorded_items.map(item => item[0]);

    // repeat each cancer for each session
    const cancer_list = [];
    least_recorded_cancers.forEach(function (item) {
        cancer_list.push(...Array.from({ length: repeat }).map(_ignored => item));
    });

    return cancer_list;
}

module.exports = {
    get_cancer_list,
    get_rand_cancer_list,
    get_filtered_cancer_list
};