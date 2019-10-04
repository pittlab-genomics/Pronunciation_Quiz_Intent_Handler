const Speech = require('ssml-builder');
const { post_gene_utterance } = require('../http_clients/gene_quiz_client.js');
var _ = require('lodash');
const gene_data = require("./gene_data.js");
const { supportsAPL, getSlotValues } = require("../common/util.js")
const dbHelper = require('./dbHelper.js');

const APLDocs = {
    gene_quiz: require('../documents/gene_quiz.json'),
};

function constructGeneQuizAPLDataSource(gene_item) {
    return {
        "bodyGeneQuizData": {
            "title": `Gene Quiz`,
            "gene_name_text": gene_item
        }
    };
}

const QuizIntentBuilder = function (handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    let promptText = "How would you pronounce this gene?";
    let repromptText = "Please pronounce the gene name on the screen.";
    let speech = new Speech();
    let quizResponse = {};

    if (!('gene_list' in sessionAttributes)) {
        let gene_list = gene_data.get_gene_list();
        sessionAttributes['gene_list'] = gene_list;
        // speech.say("Welcome to Gene Quiz.");
        // speech.pause('1s');
    }

    const remaining_genes = sessionAttributes['gene_list'];
    if (remaining_genes.length == 0) {
        console.error(`Invalid state in QuizIntentBuilder | remaining_genes: ${remaining_genes}`);
        responseBuilder.withShouldEndSession(true);
        quizResponse = {
            "speechText": "Something went wrong while loading the gene list from the session. Please try again.",
            "repromptText": ""
        };

    } else {
        const gene_quiz_item = remaining_genes.shift();
        console.log(`Inside QuizIntentBuilder | remaining_genes: ${remaining_genes}, gene_quiz_item: ${gene_quiz_item}`);
        sessionAttributes['gene_quiz_item'] = gene_quiz_item;
        speech.say(promptText);
        if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
            speech.pause('1s');
        }
        responseBuilder.withSimpleCard('Gene Quiz', gene_quiz_item);
        speechText = speech.ssml(true);
        quizResponse = {
            "speechText": speechText,
            "repromptText": repromptText
        };
    }

    return quizResponse;
}

const UserIdentifierIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'UserIdentifierIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        // check whether a session has already started
        const user_identifier = _.get(sessionAttributes, 'user_identifier');
        if (!_.isEmpty(user_identifier)) {
            return responseBuilder
                .speak("Gene quiz has already started.")
                .getResponse();
        }

        // delegate to Alexa to collect all the required slots 
        const currentIntent = request.intent;
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            return handlerInput.responseBuilder
                .addDelegateDirective(currentIntent)
                .getResponse();
        }

        let slotValues = getSlotValues(request.intent.slots);
        console.log('***** UserIdentifierIntent slotValues: ' + JSON.stringify(slotValues, null, 2));

        if (slotValues.user_identifier.heardAs) {
            let user_identifier = slotValues.user_identifier.heardAs;
            sessionAttributes['user_identifier'] = user_identifier;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
            let quizResponse = QuizIntentBuilder(handlerInput);
            return handlerInput.responseBuilder
                .speak(quizResponse.speechText)
                .reprompt(quizResponse.repromptText)
                .getResponse();

        } else {
            return responseBuilder
                .speak("Something went wrong. Please try again.")
                .getResponse();
        }
    }
};

const QuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'QuizIntent';
    },
    handle(handlerInput) {
        let quizResponse = QuizIntentBuilder(handlerInput);
        return handlerInput.responseBuilder
            .speak(quizResponse.speechText)
            .reprompt(quizResponse.repromptText)
            .getResponse();
    }
};


const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent';
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const speech = new Speech();
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const gene_quiz_item = _.get(sessionAttributes, 'gene_quiz_item');
        const remaining_genes = _.get(sessionAttributes, 'gene_list');
        const user_identifier = _.get(sessionAttributes, 'user_identifier');

        if (_.isNil(gene_quiz_item) || _.isNil(remaining_genes) || !Array.isArray(remaining_genes)) {
            console.error(`Invalid state in AnswerIntentHandler: gene_quiz_item: ${gene_quiz_item},
            remaining_genes: ${remaining_genes}`);
            return responseBuilder
                .speak("Please start the gene quiz first.")
                .getResponse();
        }

        let gene_name_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.gene_query.value');
        if (_.isNil(gene_name_utterance)) {
            console.error(`Slot value for gene_query not found: ${requestEnvelope.request.intent.slots}`);
            return responseBuilder
                .speak("I could not understand the gene. Please restart the gene quiz.")
                .getResponse();
        }

        let params = {
            'gene_name': gene_quiz_item,
            'utterance': gene_name_utterance,
            'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
            'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
            'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
            'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
            'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp'),
            'user_identifier': user_identifier
        };

        return dbHelper.addGeneUtterance(params)
            .then((data) => {
                console.log('Gene utterance saved: ', params);
                console.log(`Inside addGeneUtterance | remaining_genes: ${remaining_genes}`);

                if (remaining_genes.length == 0) {
                    console.log("Gene quiz ended.");
                    responseBuilder.withShouldEndSession(true);
                    speech.say("Thank you for taking the gene quiz. Bye!");
                    const speechText = speech.ssml();
                    return responseBuilder
                        .speak(speechText)
                        .getResponse();

                } else {
                    let quizResponse = QuizIntentBuilder(handlerInput);
                    speech.say("Okay!");
                    speech.pause('500ms');
                    speech.sayWithSSML(quizResponse.speechText);
                    const speechText = speech.ssml();

                    return responseBuilder
                        .speak(speechText)
                        .reprompt(quizResponse.repromptText)
                        .getResponse();
                }
            })
            .catch((err) => {
                console.log(`Could not save gene utterance: ${params}`, err);
                speech.say("Sorry, I'm unable to process that request for the moment. Please try again.");
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText)
                    .getResponse();
            });
    }
};

module.exports = {
    QuizIntentHandler,
    QuizIntentBuilder,
    AnswerIntentHandler,
    UserIdentifierIntentHandler
}