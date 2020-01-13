const Speech = require('ssml-builder');
var _ = require('lodash');
const gene_data = require("./gene_data_1.js");
const cancer_data = require("./cancer_data.js");
const { supportsAPL, getSlotValues } = require("../common/util.js")
const dbHelper = require('./dbHelper.js');

const cancer_quiz_response_builder = function (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;

    let promptText = "How would you pronounce this cancer name?";
    let repromptText = "Please pronounce the cancer name on the screen.";
    let speech = new Speech();
    let quizResponse = {};

    if (!('cancer_list' in sessionAttributes)) {
        let cancer_list = cancer_data.get_cancer_list();
        sessionAttributes['cancer_list'] = cancer_list;
    }

    const remaining_cancers = sessionAttributes['cancer_list'];
    if (remaining_cancers.length == 0) {
        console.error(`Invalid state in CancerQuiz | remaining_cancers: ${remaining_cancers}`);
        responseBuilder.withShouldEndSession(true);
        quizResponse = {
            "speechText": "Something went wrong while loading the cancer list from the session. Please try again.",
            "repromptText": ""
        };

    } else {
        const cancer_quiz_item = remaining_cancers.shift();
        console.log(`Inside CancerQuiz | remaining_cancers: ${remaining_cancers},` +
            `cancer_quiz_item: ${cancer_quiz_item}`);
        sessionAttributes['cancer_quiz_item'] = cancer_quiz_item;
        speech.say(promptText);
        if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
            speech.pause('1s');
        }
        responseBuilder.withSimpleCard('Cancer Quiz', cancer_quiz_item);
        speechText = speech.ssml(true);
        quizResponse = {
            "speechText": speechText,
            "repromptText": repromptText
        };
    }
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return quizResponse;
}


const gene_quiz_response_builder = async function (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;
    const user_code = sessionAttributes['user_code'];

    if (_.isNil(user_code)) {
        console.error(`Invalid state in gene_quiz_response_builder: handlerInput: ${JSON.stringify(handlerInput)}`);
        return responseBuilder
            .speak("Something went wrong while retrieving the quiz card. Please try again.");
    }

    const promptText = "How would you pronounce this gene?";
    const repromptText = "Please pronounce the gene name on the screen.";
    const speech = new Speech();
    let quizResponse = {};

    if (!('gene_list' in sessionAttributes)) {
        let gene_list = await gene_data.get_gene_list(user_code);
        sessionAttributes['gene_list'] = gene_list;
    }

    const remaining_genes = sessionAttributes['gene_list'];
    if (remaining_genes.length == 0) {
        console.error(`Invalid state in GeneQuiz | remaining_genes: ${remaining_genes}`);
        responseBuilder.withShouldEndSession(true);
        quizResponse = {
            "speechText": "Something went wrong while loading the gene list from the session. Please try again.",
            "repromptText": ""
        };

    } else {
        const gene_quiz_item = remaining_genes.shift();
        console.info(`GeneQuiz response builder | remaining_genes: ${remaining_genes},` +
            `gene_quiz_item: ${gene_quiz_item}`);
        sessionAttributes['gene_quiz_item'] = gene_quiz_item;
        speech.say(promptText);
        if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
            speech.pause('1s');
        }
        responseBuilder.withSimpleCard('Gene Quiz', gene_quiz_item);
        quizResponse = {
            "speechText": speech.ssml(true),
            "repromptText": repromptText
        };
    }
    console.info(`GeneQuiz response builder | quizResponse: ${JSON.stringify(quizResponse)}`);
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return quizResponse;
}

const process_gene_quiz_answer = function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const gene_quiz_item = _.get(sessionAttributes, 'gene_quiz_item');
    const remaining_genes = _.get(sessionAttributes, 'gene_list');
    const user_code = _.get(sessionAttributes, 'user_code');

    if (_.isNil(gene_quiz_item) || _.isNil(remaining_genes)
        || !Array.isArray(remaining_genes || _.isNil(user_code))) {
        console.error(`Invalid state in AnswerIntentHandler: gene_quiz_item: ${gene_quiz_item},
            remaining_genes: ${remaining_genes}`);
        return responseBuilder
            .speak("Please start the gene quiz first.");
    }

    let gene_name_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.quiz_answer_query.value');
    if (_.isNil(gene_name_utterance)) {
        console.error(`Slot value for quiz_answer_query not found: 
        ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        return responseBuilder
            .speak("Sorry, I could not understand what you said. Please try again.")
            .reprompt("Please pronounce the gene name on the screen");
    }

    let params = {
        'user_code': user_code,
        'gene_name': gene_quiz_item,
        'utterance': gene_name_utterance,
        'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
        'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
        'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
        'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
        'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp')
    };

    return dbHelper.addGeneUtterance(params)
        .then(async (data) => {
            console.log(`Gene utterance saved: ${JSON.stringify(params)} | ${remaining_genes}
            | data: ${JSON.stringify(data)}`);

            if (remaining_genes.length == 0) {
                console.log("Gene quiz ended.");
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the gene quiz. Bye!");
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText);

            } else {
                let quizResponse = await gene_quiz_response_builder(handlerInput);
                speech.say("Okay!");
                speech.pause('500ms');
                speech.sayWithSSML(quizResponse.speechText);
                const speechText = speech.ssml();
                console.info(`GeneQuiz speech response: ${speechText}`);

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
}

const process_cancer_quiz_answer = async function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const cancer_quiz_item = _.get(sessionAttributes, 'cancer_quiz_item');
    const remaining_cancers = _.get(sessionAttributes, 'cancer_list');
    const user_code = _.get(sessionAttributes, 'user_code');

    if (_.isNil(cancer_quiz_item) || _.isNil(remaining_cancers) || !Array.isArray(remaining_cancers)) {
        console.error(`Invalid state in AnswerIntentHandler: cancer_quiz_item: ${cancer_quiz_item},
            remaining_cancers: ${remaining_cancers}`);
        return responseBuilder
            .speak("Please start the quiz first.");
    }

    let cancer_name_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.quiz_answer_query.value');
    if (_.isNil(cancer_name_utterance)) {
        console.info(`Slot value for quiz_answer_query not found: ${JSON.stringify(requestEnvelope.request)}`);
        return responseBuilder
            .speak("I could not understand what you said. Please try again.")
            .reprompt("Please pronounce the gene name on the screen");
    }

    let params = {
        'user_code': user_code,
        'cancer_name': cancer_quiz_item,
        'utterance': cancer_name_utterance,
        'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
        'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
        'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
        'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
        'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp')
    };

    return dbHelper.addCancerUtterance(params)
        .then((data) => {
            console.log('Cancer utterance saved: ', params);
            console.log(`Inside addCancerUtterance | remaining_cancers: ${remaining_cancers}`);

            if (remaining_cancers.length == 0) {
                console.log("Cancer quiz ended.");
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the cancer quiz. Bye!");
                const speechText = speech.ssml();
                return responseBuilder.speak(speechText);

            } else {
                let quizResponse = cancer_quiz_response_builder(handlerInput);
                speech.say("Okay!");
                speech.pause('500ms');
                speech.sayWithSSML(quizResponse.speechText);
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
}

module.exports = {
    gene_quiz_response_builder,
    cancer_quiz_response_builder,
    process_gene_quiz_answer,
    process_cancer_quiz_answer
}