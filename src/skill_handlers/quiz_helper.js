const Speech = require('ssml-builder');
var _ = require('lodash');

const genes_repository = require("../dao/genes_repository");
const cancer_repository = require("../dao/cancer_repository.js");
const utterances_repository = require('../dao/utterances_repository.js');
const { supportsAPL } = require("../common/util.js")
const { user_code_names_dict, QUIZ_PROMPTS_PER_SESSION } = require('../common/config.js');

const APLDocs = {
    quiz_card: require('../../resources/APL/quiz_card.json'),
};


const gene_quiz_response_builder = async function (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;
    const user_code = sessionAttributes['user_code'];

    if (!_.isNumber(user_code)) {
        console.error(`Invalid state in gene_quiz_response_builder: handlerInput: ${JSON.stringify(handlerInput)}`);
        return responseBuilder
            .speak("Something went wrong while retrieving the quiz card. Please try again.");
    }

    const promptText = "How would you pronounce this gene?";
    const repromptText = "Please pronounce the gene name on the screen.";
    const speech = new Speech();
    let quizResponse = {};

    if (!('gene_list' in sessionAttributes)) {
        let gene_list = [];
        if (user_code in user_code_names_dict) {
            const gene_utterances = await utterances_repository.getAllGeneUtterancesByUser(user_code);
            console.log(`[gene_quiz_response_builder] user_code: ${user_code},`
                + ` gene_utterances len: ${gene_utterances.length}`);
            gene_list = await genes_repository.get_gene_ccds_list(gene_utterances, QUIZ_PROMPTS_PER_SESSION, 1);

        } else {
            gene_list = genes_repository.get_rand_gene_list(QUIZ_PROMPTS_PER_SESSION, 3);
        }

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
        const completed_items = QUIZ_PROMPTS_PER_SESSION - remaining_genes.length - 1;
        console.info(`GeneQuiz response builder | remaining_genes: ${remaining_genes},` +
            `gene_quiz_item: ${gene_quiz_item}`);

        sessionAttributes['gene_quiz_item'] = gene_quiz_item;
        speech.say(promptText);

        if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
            speech.pause('1s');
            responseBuilder.withSimpleCard(`Gene Quiz | UID: ${user_code}`,
                `${completed_items}.  ${gene_quiz_item}`);

        } else {
            const footer_text = `User ID: ${user_code} | Progress: ${completed_items}/${QUIZ_PROMPTS_PER_SESSION}`;
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: 'pagerToken',
                version: '1.0',
                document: APLDocs.quiz_card,
                datasources: {
                    'templateData': {
                        'title': 'Gene Quiz',
                        'quiz_item': gene_quiz_item,
                        'footer_text': footer_text
                    },
                },
            });
        }

        quizResponse = {
            "speechText": speech.ssml(true),
            "repromptText": repromptText
        };
    }
    console.info(`GeneQuiz response builder | quizResponse: ${JSON.stringify(quizResponse)}`);
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return quizResponse;
};

const process_gene_quiz_answer = function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const gene_quiz_item = _.get(sessionAttributes, 'gene_quiz_item');
    const remaining_genes = _.get(sessionAttributes, 'gene_list');
    const user_code = _.get(sessionAttributes, 'user_code');

    if (
        _.isNil(gene_quiz_item) || !Array.isArray(remaining_genes) || !_.isNumber(user_code)
    ) {
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

    return utterances_repository.addGeneUtterance(params)
        .then(async (data) => {
            console.log(`Gene utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);

            if (remaining_genes.length == 0) {
                console.log("Gene quiz ended.");
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the gene quiz. Bye!");
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText);

            } else {
                let quizResponse = await gene_quiz_response_builder(handlerInput);
                speech.prosody({ rate: 'fast' }, "Ok");
                // speech.pause('500ms');
                // speech.sayWithSSML(quizResponse.speechText);
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

const cancer_quiz_response_builder = function (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;
    const user_code = sessionAttributes['user_code'];

    if (!_.isNumber(user_code)) {
        console.error(`Invalid state in cancer_quiz_response_builder: handlerInput: ${JSON.stringify(handlerInput)}`);
        return responseBuilder
            .speak("Something went wrong while retrieving the quiz card. Please try again.");
    }

    let promptText = "How would you pronounce this cancer name?";
    let repromptText = "Please pronounce the cancer name on the screen.";
    let speech = new Speech();
    let quizResponse = {};

    if (!('cancer_list' in sessionAttributes)) {
        let cancer_list = cancer_repository.get_rand_cancer_list(QUIZ_PROMPTS_PER_SESSION, 1);
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
        const completed_items = QUIZ_PROMPTS_PER_SESSION - remaining_cancers.length - 1;
        console.log(`Inside CancerQuiz | remaining_cancers: ${remaining_cancers},` +
            `cancer_quiz_item: ${cancer_quiz_item}`);
        sessionAttributes['cancer_quiz_item'] = cancer_quiz_item;
        speech.say(promptText);
        if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
            speech.pause('1s');
            responseBuilder.withSimpleCard(`Cancer Quiz | UID: ${user_code}`,
                `${completed_items}.  ${cancer_quiz_item}`);

        } else {
            const footer_text = `User ID: ${user_code} | Progress: ${completed_items}/${QUIZ_PROMPTS_PER_SESSION}`;
            handlerInput.responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: 'pagerToken',
                version: '1.0',
                document: APLDocs.quiz_card,
                datasources: {
                    'templateData': {
                        'title': 'Cancer Quiz',
                        'quiz_item': cancer_quiz_item,
                        'footer_text': footer_text
                    },
                },
            });
        }

        quizResponse = {
            "speechText": speech.ssml(true),
            "repromptText": repromptText
        };
    }
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    return quizResponse;
};

const process_cancer_quiz_answer = async function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const cancer_quiz_item = _.get(sessionAttributes, 'cancer_quiz_item');
    const remaining_cancers = _.get(sessionAttributes, 'cancer_list');
    const user_code = _.get(sessionAttributes, 'user_code');

    if (
        _.isNil(cancer_quiz_item) || !Array.isArray(remaining_cancers) || !_.isNumber(user_code)
    ) {
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
            .reprompt("Please pronounce the cancer name on the screen");
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

    return utterances_repository.addCancerUtterance(params)
        .then((data) => {
            console.log(`Cancer utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);

            if (remaining_cancers.length == 0) {
                console.log("Cancer quiz ended.");
                responseBuilder.withShouldEndSession(true);
                speech.say("Thank you for taking the cancer quiz. Bye!");
                const speechText = speech.ssml();
                return responseBuilder.speak(speechText);

            } else {
                let quizResponse = cancer_quiz_response_builder(handlerInput);
                speech.prosody({ rate: 'fast' }, "Ok");
                // speech.pause('500ms');
                // speech.sayWithSSML(quizResponse.speechText);
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

const test_quiz_response_builder = function (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;

    let promptText = "What is your query?";
    let repromptText = "Please provide your query";
    let speech = new Speech();
    let quizResponse = {};
    let last_utterance = '-';
    const footer_text = 'Alexa, show me Petrificus Totalus!';

    if (!_.isEmpty(sessionAttributes['last_utterance'])) {
        last_utterance = sessionAttributes['last_utterance'];
    }

    speech.say(promptText);
    if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
        speech.pause('1s');
        responseBuilder.withSimpleCard('Test Quiz', last_utterance);

    } else {
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: 'pagerToken',
            version: '1.0',
            document: APLDocs.quiz_card,
            datasources: {
                'templateData': {
                    'title': 'Test Quiz',
                    'quiz_item': last_utterance,
                    'footer_text': footer_text
                },
            },
        });
    }

    quizResponse = {
        "speechText": speech.ssml(true),
        "repromptText": repromptText
    };
    return quizResponse;
};

const process_test_quiz_answer = function (handlerInput) {
    const speech = new Speech();
    const responseBuilder = handlerInput.responseBuilder;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let test_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.quiz_answer_query.value');
    if (_.isNil(test_utterance)) {
        console.error(`Slot value for quiz_answer_query not found: 
        ${JSON.stringify(handlerInput.requestEnvelope.request)}`);
        return responseBuilder
            .speak("Sorry, I could not understand what you said. Please try again.")
            .reprompt("What is your query?");
    }

    // store the utterance as the last recorded answer in session
    sessionAttributes['last_utterance'] = test_utterance;

    let params = {
        'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
        'utterance': test_utterance,
        'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
        'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
        'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
        'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp')
    };

    return utterances_repository.addTestUtterance(params)
        .then(async (data) => {
            console.log(`Test utterance saved: ${JSON.stringify(params)} | data: ${JSON.stringify(data)}`);

            let quizResponse = test_quiz_response_builder(handlerInput);
            speech.prosody({ rate: 'fast' }, "Ok");
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
    test_quiz_response_builder,
    process_gene_quiz_answer,
    process_cancer_quiz_answer,
    process_test_quiz_answer
}