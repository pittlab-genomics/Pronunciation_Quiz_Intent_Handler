const Speech = require('ssml-builder');
var _ = require('lodash');
const {
    gene_quiz_response_builder,
    cancer_quiz_response_builder,
    process_gene_quiz_answer,
    process_cancer_quiz_answer
} = require("./quiz_helper.js");
const { getSlotValues } = require("../common/util.js")


const UserIdentifierIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'UserIdentifierIntent';
    },
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const user_identifier = _.get(sessionAttributes, 'user_identifier');
        console.info(`[UserIdentifierIntentHandler] user_identifier: ${user_identifier}`);

        if (!_.isEmpty(user_identifier)) { // check whether a session has already started
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

        const slotValues = getSlotValues(request.intent.slots);
        console.log('***** UserIdentifierIntent slotValues: ' + JSON.stringify(slotValues, null, 2));

        const quiz = _.get(sessionAttributes, 'quiz');
        let quizResponse = {};

        if (slotValues.user_identifier.heardAs && quiz) {
            const user_identifier = slotValues.user_identifier.heardAs;
            sessionAttributes['user_identifier'] = user_identifier;
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            if (quiz === 'GENE_QUIZ') {
                quizResponse = gene_quiz_response_builder(handlerInput);

            } else if (quiz === 'CANCER_QUIZ') {
                quizResponse = cancer_quiz_response_builder(handlerInput);

            } else {
                console.error(`Session attribute quiz is invalid: ${JSON.stringify(requestEnvelope)}`);
                return responseBuilder
                    .speak("Please start a quiz first. Bye.")
                    .getResponse();
            }

            return handlerInput.responseBuilder
                .speak(quizResponse.speechText)
                .reprompt(quizResponse.repromptText)
                .getResponse();

        } else {
            return responseBuilder
                .speak("Something went wrong. Please try again. Bye.")
                .getResponse();
        }
    }
};

const GeneQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GeneQuizIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['quiz'] = 'GENE_QUIZ';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
            .addElicitSlotDirective('user_identifier', {
                name: 'UserIdentifierIntent',
                confirmationStatus: 'NONE',
                slots: {}
            })
            .speak("Ok, let's play the gene quiz. What is your identification code?")
            .reprompt("Please provide your four-digit user identification code.")
            .getResponse();;
    }
};

const CancerQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CancerQuizIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes['quiz'] = 'CANCER_QUIZ';
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
            .addElicitSlotDirective('user_identifier', {
                name: 'UserIdentifierIntent',
                confirmationStatus: 'NONE',
                slots: {}
            })
            .speak("Ok, let's play the cancer quiz. What is your identification code?")
            .reprompt("Please provide your four-digit user identification code.")
            .getResponse();;
    }
};


const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const responseBuilder = handlerInput.responseBuilder;
        const quiz = _.get(sessionAttributes, 'quiz');
        let response = {};
        console.error(`[AnswerIntentHandler] quiz: ${JSON.stringify(quiz)}`);

        if (quiz === 'GENE_QUIZ') {
            response = await process_gene_quiz_answer(handlerInput);

        } else if (quiz === 'CANCER_QUIZ') {
            response = await process_cancer_quiz_answer(handlerInput);

        } else {
            console.error(`Session attribute quiz is not set: ${JSON.stringify(requestEnvelope)}`);
            return handlerInput.responseBuilder
                .speak("Please start a quiz first.");
        }
        console.info(`[AnswerIntentHandler] response = ${JSON.stringify(response)}`);
        return responseBuilder.getResponse();
    }
};

module.exports = {
    GeneQuizIntentHandler,
    CancerQuizIntentHandler,
    AnswerIntentHandler,
    UserIdentifierIntentHandler
}
