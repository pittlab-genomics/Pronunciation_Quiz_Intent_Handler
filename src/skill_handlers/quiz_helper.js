const Speech = require("ssml-builder");
var _ = require("lodash");

const genes_repository = require("../dao/genes_repository");
const cancer_repository = require("../dao/cancer_repository.js");
const category_repository = require("../dao/category_repository.js");
const utterances_repository = require("../dao/utterances_repository.js");
const {
    populate_quiz_display, populate_display 
} = require("../common/util.js");
const {
    user_code_names_dict, GENE_QUIZ_PROMPTS_PER_SESSION 
} = require("../common/config.js");
const { get_oov_mapping_by_query } = require("../http_clients/oov_mapper_client.js");

const gene_quiz_response_builder = async function (handlerInput, repeat_only = false) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;
    const user_code = sessionAttributes["user_code"];
    const gene_prompt_repeats = 1;

    if (!_.isNumber(user_code)) {
        console.error(`Invalid state in gene_quiz_response_builder: handlerInput: ${JSON.stringify(handlerInput)}`);
        return responseBuilder
            .speak("Something went wrong while retrieving the quiz card. Please try again.");
    }

    const promptText = "How would you pronounce this gene?";
    const repromptText = "Please pronounce the gene name on the screen.";
    const speech = new Speech();
    let quizResponse = {};

    if (!("gene_list" in sessionAttributes)) {
        let gene_list = [];
        if (user_code in user_code_names_dict) { // maximize utterances coverage for known users
            const gene_utterances = await utterances_repository.getAllGeneUtterances(); 
            console.log(`[gene_quiz_response_builder] user_code: ${user_code},`
                + ` gene_utterances len: ${gene_utterances.length}`);
            gene_list = genes_repository.get_gene_ccds_list(gene_utterances, 
                GENE_QUIZ_PROMPTS_PER_SESSION, gene_prompt_repeats);

        } else {
            gene_list = genes_repository.get_rand_gene_list(GENE_QUIZ_PROMPTS_PER_SESSION, 3);
        }

        sessionAttributes["gene_list"] = gene_list;
        sessionAttributes["gene_list_length"] = gene_list.length;
    }

    const remaining_genes = sessionAttributes["gene_list"];
    if (!repeat_only && remaining_genes.length == 0) {
        console.error(`Invalid state in GeneQuiz | remaining_genes: ${remaining_genes}`);
        responseBuilder.withShouldEndSession(true);
        quizResponse = {
            "speechText":   "There are no items in the gene list. Please check back later.",
            "repromptText": ""
        };

    } else {
        const gene_list_length = _.get(sessionAttributes, "gene_list_length");
        let gene_quiz_item = "";        
        if (repeat_only) {
            gene_quiz_item = _.get(sessionAttributes, "gene_quiz_item");
        } else {
            gene_quiz_item = remaining_genes.shift();
        }

        console.info(`GeneQuiz response builder | remaining_genes: ${remaining_genes},` +
            `gene_quiz_item: ${gene_quiz_item}`);

        sessionAttributes["gene_quiz_item"] = gene_quiz_item;
        speech.say(promptText);

        populate_quiz_display(handlerInput, "Gene Quiz", user_code, 
            gene_list_length, remaining_genes.length, gene_quiz_item);

        quizResponse = {
            "speechText":   speech.ssml(true),
            "repromptText": repromptText
        };
    }
    console.info(`GeneQuiz response builder | quizResponse: ${JSON.stringify(quizResponse)}`);
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    console.info(`[gene_quiz_response_builder] quizResponse: ${JSON.stringify(quizResponse)}`);
    return quizResponse;
};

const process_gene_quiz_answer = function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const gene_quiz_item = _.get(sessionAttributes, "gene_quiz_item");
    const remaining_genes = _.get(sessionAttributes, "gene_list");
    const user_code = _.get(sessionAttributes, "user_code");
    const gene_list_length = _.get(sessionAttributes, "gene_list_length");

    if (
        _.isNil(gene_quiz_item) || !Array.isArray(remaining_genes) || !_.isNumber(user_code)
    ) {
        console.error(`Invalid state in AnswerIntentHandler: gene_quiz_item: ${gene_quiz_item},
            remaining_genes: ${remaining_genes}`);
        return responseBuilder
            .speak("Please start the gene quiz first.");
    }

    let gene_name_utterance = _.get(handlerInput, "requestEnvelope.request.intent.slots.quiz_answer_query.value");
    if (_.isNil(gene_name_utterance)) {
        console.error(`Slot value for quiz_answer_query not found: 
        ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        return responseBuilder
            .speak("Sorry, I could not understand what you said. Please try again.")
            .reprompt("Please pronounce the gene name on the screen");
    }

    let params = {
        "user_code":        user_code,
        "gene_name":        gene_quiz_item,
        "utterance":        gene_name_utterance,
        "device_id":        _.get(handlerInput, "requestEnvelope.context.System.device.deviceId"),
        "user_id":          _.get(handlerInput, "requestEnvelope.context.System.user.userId"),
        "session_id":       _.get(handlerInput, "requestEnvelope.session.sessionId"),
        "request_id":       _.get(handlerInput, "requestEnvelope.request.requestId"),
        "intent_timestamp": _.get(handlerInput, "requestEnvelope.request.timestamp")
    };

    return utterances_repository.addGeneUtterance(params)
        .then(async (data) => {
            console.log(`Gene utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);

            if (remaining_genes.length == 0) {
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the gene quiz. Bye!");
                const speechText = speech.ssml();

                populate_quiz_display(handlerInput, "Gene Quiz", user_code, 
                    gene_list_length, remaining_genes.length, "Thank you!");
                return responseBuilder
                    .speak(speechText);

            } else {
                const quizResponse = await gene_quiz_response_builder(handlerInput);
                console.info(`[process_gene_quiz_answer] quizResponse: ${JSON.stringify(quizResponse)}`);
                speech.prosody({ rate: "fast" }, "Ok");
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText)
                    .reprompt(quizResponse.repromptText);
            }
        })
        .catch((err) => {
            console.log(`Could not save gene utterance: ${params}`, err);
            speech.say("Sorry, I'm unable to process that request for the moment. Please try again.");
            const speechText = speech.ssml();
            return responseBuilder
                .speak(speechText);
        });
};

const cancer_quiz_response_builder = async function (handlerInput, repeat_only=false) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;
    const user_code = sessionAttributes["user_code"];

    if (!_.isNumber(user_code)) {
        console.error(`Invalid state in cancer_quiz_response_builder: handlerInput: ${JSON.stringify(handlerInput)}`);
        return responseBuilder
            .speak("Something went wrong while retrieving the quiz card. Please try again.");
    }

    const promptText = "How would you pronounce this cancer name?";
    const repromptText = "Please pronounce the cancer name on the screen.";
    const speech = new Speech();
    let quizResponse = {};

    if (!("cancer_list" in sessionAttributes)) {
        let cancer_list = [];
        if (user_code in user_code_names_dict) { // maximize utterances coverage from known users 
            const cancer_utterances = await utterances_repository.getAllCancerUtterancesByUser(user_code); 
            console.log(`[cancer_quiz_response_builder] user_code: ${user_code},`
                + ` cancer_utterances len: ${cancer_utterances.length}`);
            cancer_list = cancer_repository.get_filtered_cancer_list(cancer_utterances);

        } else {
            cancer_list = cancer_repository.get_rand_cancer_list();
        }

        sessionAttributes["cancer_list"] = cancer_list;
        sessionAttributes["cancer_list_length"] = cancer_list.length;
    }

    const remaining_cancers = sessionAttributes["cancer_list"];
    if (!repeat_only && remaining_cancers.length == 0) {
        console.error(`Invalid state in CancerQuiz | remaining_cancers: ${remaining_cancers}`);
        responseBuilder.withShouldEndSession(true);
        quizResponse = {
            "speechText":   "There are no items in the cancer list. Please check back later.",
            "repromptText": ""
        };

    } else {
        const cancer_list_length = _.get(sessionAttributes, "cancer_list_length");
        let cancer_quiz_item = "";        
        if (repeat_only) {
            cancer_quiz_item = _.get(sessionAttributes, "cancer_quiz_item");
        } else {
            cancer_quiz_item = remaining_cancers.shift();
        }

        console.log(`Inside CancerQuiz | remaining_cancers: ${remaining_cancers},` +
            `cancer_quiz_item: ${cancer_quiz_item}`);
        sessionAttributes["cancer_quiz_item"] = cancer_quiz_item;
        speech.say(promptText);

        populate_quiz_display(handlerInput, "Cancer Quiz", user_code, 
            cancer_list_length, remaining_cancers.length, cancer_quiz_item);

        quizResponse = {
            "speechText":   speech.ssml(true),
            "repromptText": repromptText
        };
    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    console.info(`[cancer_quiz_response_builder] quizResponse: ${JSON.stringify(quizResponse)}`);
    return quizResponse;
};

const process_cancer_quiz_answer = async function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const cancer_quiz_item = _.get(sessionAttributes, "cancer_quiz_item");
    const remaining_cancers = _.get(sessionAttributes, "cancer_list");
    const user_code = _.get(sessionAttributes, "user_code");
    const cancer_list_length = _.get(sessionAttributes, "cancer_list_length");

    if (
        _.isNil(cancer_quiz_item) || !Array.isArray(remaining_cancers) || !_.isNumber(user_code)
    ) {
        console.error(`Invalid state in AnswerIntentHandler: cancer_quiz_item: ${cancer_quiz_item},
            remaining_cancers: ${remaining_cancers}`);
        return responseBuilder
            .speak("Please start the quiz first.");
    }

    let cancer_name_utterance = _.get(handlerInput, "requestEnvelope.request.intent.slots.quiz_answer_query.value");
    if (_.isNil(cancer_name_utterance)) {
        console.info("Slot value for quiz_answer_query not found: " 
        + `${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        return responseBuilder
            .speak("I could not understand what you said. Please try again.")
            .reprompt("Please pronounce the cancer name on the screen");
    }

    let params = {
        "user_code":        user_code,
        "cancer_name":      cancer_quiz_item,
        "utterance":        cancer_name_utterance,
        "device_id":        _.get(handlerInput, "requestEnvelope.context.System.device.deviceId"),
        "user_id":          _.get(handlerInput, "requestEnvelope.context.System.user.userId"),
        "session_id":       _.get(handlerInput, "requestEnvelope.session.sessionId"),
        "request_id":       _.get(handlerInput, "requestEnvelope.request.requestId"),
        "intent_timestamp": _.get(handlerInput, "requestEnvelope.request.timestamp")
    };

    return utterances_repository.addCancerUtterance(params)
        .then(async (data) => {
            console.log(`Cancer utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);

            if (remaining_cancers.length == 0) {
                console.log("Cancer quiz ended.");
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the cancer quiz. Bye!");
                const speechText = speech.ssml();
                populate_quiz_display(handlerInput, "Cancer Quiz", user_code, 
                    cancer_list_length, remaining_cancers.length, "Thank you!");
                return responseBuilder.speak(speechText);

            } else {
                const quizResponse = await cancer_quiz_response_builder(handlerInput);
                console.info(`[process_cancer_quiz_answer] quizResponse: ${JSON.stringify(quizResponse)}`);
                speech.prosody({ rate: "fast" }, "Ok");
                const speechText = speech.ssml();

                return responseBuilder
                    .speak(speechText)
                    .reprompt(quizResponse.repromptText);
            }
        })
        .catch((err) => {
            console.log(`Could not save cancer utterance: ${params}`, err);
            speech.say("Sorry, I'm unable to process that request for the moment. Please try again.");
            const speechText = speech.ssml();
            return responseBuilder
                .speak(speechText);
        });
};


const category_quiz_response_builder = async function (handlerInput, repeat_only = false) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;
    const user_code = sessionAttributes["user_code"];

    if (!_.isNumber(user_code)) {
        console.error(`Invalid state in category_quiz_response_builder: handlerInput: ${JSON.stringify(handlerInput)}`);
        return responseBuilder
            .speak("Something went wrong while retrieving the quiz card. Please try again.");
    }

    const promptText = "How would you pronounce this category name?";
    const repromptText = "Please pronounce the category name on the screen.";
    const speech = new Speech();
    let quizResponse = {};

    if (!("category_list" in sessionAttributes)) {
        let category_list = [];
        if (user_code in user_code_names_dict) { // maximize utterances coverage from known users 
            const category_utterances = await utterances_repository.getAllCategoryUtterancesByUser(user_code); 
            console.log(`[category_quiz_response_builder] user_code: ${user_code},`
                + ` category_utterances len: ${category_utterances.length}`);
            category_list = category_repository.get_filtered_category_list(category_utterances);

        } else {
            category_list = category_repository.get_rand_category_list();
        }

        sessionAttributes["category_list"] = category_list;
        sessionAttributes["category_list_length"] = category_list.length;
    }

    const remaining_categories = sessionAttributes["category_list"];
    if (!repeat_only && remaining_categories.length == 0) {
        console.error(`Invalid state in CategoryQuiz | remaining_categories: ${remaining_categories}`);
        responseBuilder.withShouldEndSession(true);
        quizResponse = {
            "speechText":   "There are no items in the category list. Please check back later.",
            "repromptText": ""
        };

    } else {
        const category_list_length = _.get(sessionAttributes, "category_list_length");
        let category_quiz_item = "";        
        if (repeat_only) {
            category_quiz_item = _.get(sessionAttributes, "category_quiz_item");
        } else {
            category_quiz_item = remaining_categories.shift();
        }

        console.log(`Inside CategoryQuiz | remaining_categories: ${remaining_categories},` +
            `category_quiz_item: ${category_quiz_item}`);
        sessionAttributes["category_quiz_item"] = category_quiz_item;
        speech.say(promptText);

        populate_quiz_display(handlerInput, "Category Quiz", user_code, 
            category_list_length, remaining_categories.length, category_quiz_item);

        quizResponse = {
            "speechText":   speech.ssml(true),
            "repromptText": repromptText
        };
    }

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    console.info(`[category_quiz_response_builder] quizResponse: ${JSON.stringify(quizResponse)}`);
    return quizResponse;
};

const process_category_quiz_answer = async function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const category_quiz_item = _.get(sessionAttributes, "category_quiz_item");
    const remaining_categories = _.get(sessionAttributes, "category_list");
    const user_code = _.get(sessionAttributes, "user_code");
    const category_list_length = _.get(sessionAttributes, "category_list_length");

    if (
        _.isNil(category_quiz_item) || !Array.isArray(remaining_categories) || !_.isNumber(user_code)
    ) {
        console.error(`Invalid state in AnswerIntentHandler: category_quiz_item: ${category_quiz_item},
        remaining_categories: ${remaining_categories}`);
        return responseBuilder
            .speak("Please start the quiz first.");
    }

    let category_name_utterance = _.get(handlerInput, "requestEnvelope.request.intent.slots.quiz_answer_query.value");
    if (_.isNil(category_name_utterance)) {
        console.info("Slot value for quiz_answer_query not found: " + 
        `${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        return responseBuilder
            .speak("I could not understand what you said. Please try again.")
            .reprompt("Please pronounce the category name on the screen");
    }

    let params = {
        "user_code":        user_code,
        "category_name":    category_quiz_item,
        "utterance":        category_name_utterance,
        "device_id":        _.get(handlerInput, "requestEnvelope.context.System.device.deviceId"),
        "user_id":          _.get(handlerInput, "requestEnvelope.context.System.user.userId"),
        "session_id":       _.get(handlerInput, "requestEnvelope.session.sessionId"),
        "request_id":       _.get(handlerInput, "requestEnvelope.request.requestId"),
        "intent_timestamp": _.get(handlerInput, "requestEnvelope.request.timestamp")
    };

    return utterances_repository.addCategoryUtterance(params)
        .then(async (data) => {
            console.log(`Category utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);

            if (remaining_categories.length == 0) {
                console.log("Category quiz ended.");
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the category quiz. Bye!");
                const speechText = speech.ssml();
                populate_quiz_display(handlerInput, "Category Quiz", user_code,
                    category_list_length, remaining_categories.length, "Thank you!");
                return responseBuilder.speak(speechText);

            } else {
                const quizResponse = await category_quiz_response_builder(handlerInput);
                console.info(`[process_category_quiz_answer] quizResponse: ${JSON.stringify(quizResponse)}`);
                speech.prosody({ rate: "fast" }, "Ok");
                const speechText = speech.ssml();

                return responseBuilder
                    .speak(speechText)
                    .reprompt(quizResponse.repromptText);
            }
        })
        .catch((err) => {
            console.log(`Could not save category utterance: ${params}`, err);
            speech.say("Sorry, I'm unable to process that request for the moment. Please try again.");
            const speechText = speech.ssml();
            return responseBuilder
                .speak(speechText);
        });
};

const test_quiz_response_builder = function (handlerInput) {
    const promptText = "What is your query?";
    const repromptText = "Please provide your query";
    const speech = new Speech();
    let quizResponse = {};
    let last_utterance = "";
    let oov_text = "";
    const footer_text = "Alexa, show me Petrificus Totalus!";

    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    if (!_.isEmpty(sessionAttributes["last_utterance"])) {
        last_utterance = sessionAttributes["last_utterance"];
    }
    if (!_.isEmpty(sessionAttributes["oov_response"])) {
        const oov_response = sessionAttributes["oov_response"];
        const oov_entity_type = _.get(oov_response, "data.type");
        const oov_entity_value = _.get(oov_response, "data.val");
        const oov_model = _.get(oov_response, "data.stage");
        oov_text = ` type: ${oov_entity_type}\n value: ${oov_entity_value}\n stage: ${oov_model}`;
    }

    const item_text = `query: ${last_utterance}\n\n${oov_text}`;
    speech.say(promptText);
    populate_display(handlerInput, "Test Quiz", item_text, footer_text);

    quizResponse = {
        "speechText":   speech.ssml(true),
        "repromptText": repromptText
    };
    return quizResponse;
};

const process_test_quiz_answer = async function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let test_utterance = _.get(handlerInput, "requestEnvelope.request.intent.slots.quiz_answer_query.value");
    if (_.isNil(test_utterance)) {
        console.error(`[process_test_quiz_answer] slot value for quiz_answer_query not found: 
        ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        return responseBuilder
            .speak("Sorry, I could not understand what you said. Please try again.")
            .reprompt("What is your query?");
    }

    // store the utterance as the last recorded answer in session
    sessionAttributes["last_utterance"] = test_utterance;

    // resolve genomic entity using OOV mapper service
    const oov_params = { "query": test_utterance };
    let oov_response = {};
    try {
        oov_response = await get_oov_mapping_by_query(handlerInput, oov_params);
    } catch(error) {
        console.error("[process_test_quiz_answer] could not get OOV mapper result:" +
        JSON.stringify(oov_params), error);
        speech.say("Sorry, I'm unable to reach the mapper service at the moment. Please try again later.");
        const speechText = speech.ssml();
        return responseBuilder.speak(speechText);
    }
    
    sessionAttributes["oov_response"] = oov_response;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    let params = {
        "user_id":          _.get(handlerInput, "requestEnvelope.context.System.user.userId"),
        "utterance":        test_utterance,
        "oov_response":     oov_response,
        "device_id":        _.get(handlerInput, "requestEnvelope.context.System.device.deviceId"),
        "session_id":       _.get(handlerInput, "requestEnvelope.session.sessionId"),
        "request_id":       _.get(handlerInput, "requestEnvelope.request.requestId"),
        "intent_timestamp": _.get(handlerInput, "requestEnvelope.request.timestamp")
    };

    return utterances_repository.addTestUtterance(params)
        .then((data) => {
            console.log(`Test utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);
            let quizResponse = test_quiz_response_builder(handlerInput);
            speech.prosody({ rate: "fast" }, "Ok");
            const speechText = speech.ssml();
            console.info(`TestQuiz speech response: ${speechText}`);

            return responseBuilder
                .speak(speechText)
                .reprompt(quizResponse.repromptText);
        })
        .catch((err) => {
            console.log(`Could not save test utterance: ${params}`, err);
            speech.say("Sorry, I'm unable to process that request for the moment. Please try again.");
            const speechText = speech.ssml();
            return responseBuilder
                .speak(speechText);
        });
};

module.exports = {
    gene_quiz_response_builder,
    cancer_quiz_response_builder,
    category_quiz_response_builder,
    test_quiz_response_builder,
    process_gene_quiz_answer,
    process_cancer_quiz_answer,
    process_category_quiz_answer,
    process_test_quiz_answer
};