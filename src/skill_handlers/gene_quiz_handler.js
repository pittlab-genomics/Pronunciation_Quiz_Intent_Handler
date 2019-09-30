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
    const isNewSession = _.get(handlerInput, 'requestEnvelope.session.new', false);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const responseBuilder = handlerInput.responseBuilder;

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    let promptText = "How would you pronounce this gene?";
    let repromptText = "Please pronounce the gene name on the screen.";
    let speech = new Speech();
    let quizResponse = {};

    if (isNewSession) {
        let gene_list = gene_data.get_gene_list();
        sessionAttributes['gene_list'] = gene_list;
        speech.say("Welcome to Gene Quiz.");
        speech.pause('1s');
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

        // if (supportsAPL(handlerInput)) {
        //     responseBuilder.addDirective({
        //         type: 'Alexa.Presentation.APL.RenderDocument',
        //         version: '1.0',
        //         document: APLDocs.gene_quiz,
        //         datasources: constructGeneQuizAPLDataSource(gene_quiz_item),
        //     });
        // } else {
        //     speech.pause('4s');
        //     responseBuilder.withSimpleCard('Gene Quiz', gene_quiz_item);
        // }

        // responseBuilder.addElicitSlotDirective('GeneName', {
        //     name: 'AnswerIntent',
        //     confirmationStatus: 'NONE',
        //     slots: {}
        // });

        speech.say(promptText);
        speech.pause('3s');
        responseBuilder.withSimpleCard('Gene Quiz', gene_quiz_item);
        speechText = speech.ssml(true);
        quizResponse = {
            "speechText": speechText,
            "repromptText": repromptText
        };
    }

    return quizResponse;
}

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
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const gene_quiz_item = _.get(sessionAttributes, 'gene_quiz_item');
        const remaining_genes = _.get(sessionAttributes, 'gene_list');

        if (_.isNil(gene_quiz_item) || _.isNil(remaining_genes) || !Array.isArray(remaining_genes)) {
            console.error(`Invalid state in AnswerIntentHandler: gene_quiz_item: ${gene_quiz_item},
            remaining_genes: ${remaining_genes}`);
            return responseBuilder
                .speak("Please start the gene quiz first.")
                .getResponse();
        }

        // delegate to Alexa to collect all the required slots 
        // const currentIntent = request.intent;
        // if (request.dialogState && request.dialogState !== 'COMPLETED') {
        //     console.log(`Inside AnswerIntentHandler | dialogState: ${request.dialogState}`)
        //     return responseBuilder
        //         .addDelegateDirective(currentIntent)
        //         .getResponse();
        // }

        let gene_name_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.gene_query.value');
        if (_.isNil(gene_name_utterance)) {
            console.error(`Slot value for gene_query not found: ${requestEnvelope.request.intent.slots}`);
            return responseBuilder
                .speak("I could not understand the gene. Please restart the gene quiz.")
                .getResponse();
        }

        // let slotValues = getSlotValues(request.intent.slots);
        // console.log('***** slotValues: ' + JSON.stringify(slotValues, null, 2));
        // let gene_name_utterance = slotValues.GeneName.resolved

        let params = {
            'gene_name': gene_quiz_item,
            'utterance': gene_name_utterance,
            'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
            'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
            'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
            'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
            'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp')
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
                console.log(`Error occured while saving gene utterance: ${params}`, err);
                speech.say(`Sorry, I'm unable to process that request for the moment. Please try the gene quiz later.`);
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText)
                    .getResponse();
            });

        // try {
        //     let response = await post_gene_utterance(params);
        //     console.log(`post_gene_utterance response: ${JSON.stringify(response)}`);
        //     if (response['data']) {

        //         if (remaining_genes.length == 0) {
        //             responseBuilder.withShouldEndSession(true);
        //             speech.say("Thank you for taking the gene quiz. Bye!");
        //         } else {
        //             speech.say("Okay!");
        //         }


        //         speechText = speech.ssml();

        //         // clear the session attribute after successfully recording the response
        //         sessionAttributes['gene_quiz_item'] = null;
        //         handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        //     } else if (response['error']) {
        //         speech.say(`There was a problem while recording the response. Please try again.`);
        //         speechText = speech.ssml();

        //     } else {
        //         speech.say(`Something went wrong. Please try again later.`);
        //         speechText = speech.ssml();
        //     }

        // } catch (error) {
        //     speech.say(`Sorry, I'm unable to process that request for the moment. Please try the gene quiz later.`);
        //     speechText = speech.ssml();
        //     console.error(`Intent: ${handlerInput.requestEnvelope.request.intent.name}: message: ${error.message}`, error);
        // }



        // let say = 'Okay !';
        // return responseBuilder
        //     .speak(say)
        //     .addDelegateDirective({
        //         name: 'QuizIntent',
        //         confirmationStatus: 'NONE',
        //         slots: {}
        //     })
        //     .getResponse();

        // let quizResponse = QuizIntentBuilder(handlerInput);

        // return handlerInput.responseBuilder
        //     .speak(speechText)
        //     .getResponse();
    }
};


const RoundsSetIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'RoundsSetIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        const currentIntent = request.intent;
        if (request.dialogState && request.dialogState !== 'COMPLETED') {
            return handlerInput.responseBuilder
                .addDelegateDirective(currentIntent)
                .getResponse();
        }

        let rounds_count = _.get(handlerInput, 'requestEnvelope.request.intent.slots.RoundsCount.value');
        if (_.isNil(rounds_count) || rounds_count === '') {

        }
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['rounds_count'] = gene_quiz_item;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        let speechText = '';
        let speech = new Speech();

        return responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();

    }
};

module.exports = {
    QuizIntentHandler,
    QuizIntentBuilder,
    AnswerIntentHandler,
    RoundsSetIntentHandler
}