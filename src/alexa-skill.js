'use strict';

const Alexa = require('ask-sdk-core');
const Speech = require('ssml-builder');
var _ = require('lodash');

const { RequestLogInterceptor, ResponseLogInterceptor } = require('./interceptors.js');
const { ImageViewerIntentHandler } = require('./skill_handlers/image_viewer_handler.js');
const { SearchGeneIntentHandler } = require('./skill_handlers/gene_handler.js');
const {
    GeneQuizIntentHandler,
    CancerQuizIntentHandler,
    AnswerIntentHandler,
    UserIdentifierIntentHandler
} = require('./skill_handlers/quiz_handler.js');
const {
    ExpertAnswerIntentHandler,
    StartExpertAnswerIntentHandler
} = require('./skill_handlers/expert_pronunciation_handler.js');


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak("Welcome to gene quiz. We have gene quiz and cancer quiz. Which one would you like to play?")
            .reprompt("Which would you like to play? Gene quiz or cancer quiz.")
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt('Would you like to try again?')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`, error);
        const speechText = `Sorry, I'm unable to process that request for the moment. Please try again later.`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};


const TestIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'TestIntent';
    },
    handle(handlerInput) {
        let speechText = 'This is a test handler response.';

        let gene_name = _.get(handlerInput, 'requestEnvelope.request.intent.slots.gene.value');
        let study_name = _.get(handlerInput, 'requestEnvelope.request.intent.slots.study.value');
        let study_id = _.get(handlerInput, 'requestEnvelope.request.intent.slots.study.resolutions.resolutionsPerAuthority[0].values[0].value.id');

        let params = { gene_name, study_name, study_id };
        console.log(`TestIntentHandler params = ${JSON.stringify(params)}`);

        if (!_.isNil(gene_name)) {
            speechText += `Gene name is ${gene_name}.`
        }

        if (!_.isNil(study_name)) {
            speechText += `Study name is ${study_name} and study id is ${study_id}.`
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestInterceptors(RequestLogInterceptor)
    .addResponseInterceptors(ResponseLogInterceptor)
    .addRequestHandlers(
        LaunchRequestHandler,

        UserIdentifierIntentHandler,
        GeneQuizIntentHandler,
        CancerQuizIntentHandler,
        AnswerIntentHandler,

        SearchGeneIntentHandler,
        ImageViewerIntentHandler,

        ExpertAnswerIntentHandler,
        StartExpertAnswerIntentHandler,

        TestIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,

        // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();