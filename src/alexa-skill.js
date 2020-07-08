"use strict";

const Alexa = require("ask-sdk-core");
const Speech = require("ssml-builder");

const { RequestLogInterceptor, ResponseLogInterceptor } = require("./interceptors.js");
const { SearchGeneIntentHandler } = require("./skill_handlers/searchgene_handler.js");
const {
    GeneQuizIntentHandler,
    CancerQuizIntentHandler,
    CategoryQuizIntentHandler,
    TestQuizIntentHandler,
    AnswerIntentHandler,
    UserIdentifierIntentHandler,
    RepeatQuizIntentHandler
} = require("./skill_handlers/quiz_handler.js");
const {
    ExpertAnswerIntentHandler,
    StartExpertAnswerIntentHandler
} = require("./skill_handlers/expertquiz_handler.js");


const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
    },
    handle(handlerInput) {
        const speech = new Speech();
        speech
            .say("Welcome to gene quiz.")
            .prosody({ rate: "115%" },
                "We have gene quiz, cancer quiz, category quiz and test quiz. Which one would you like to play?");

        return handlerInput.responseBuilder
            .speak(speech.ssml(true))
            .reprompt("Which would you like to play? Gene quiz, cancer quiz, category quiz or test quiz.")
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AMAZON.HelpIntent";
    },
    handle(handlerInput) {
        const speechText = "You can say hello to me! How can I help?";

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && (handlerInput.requestEnvelope.request.intent.name === "AMAZON.CancelIntent"
                || handlerInput.requestEnvelope.request.intent.name === "AMAZON.StopIntent");
    },
    handle(handlerInput) {
        const speechText = "Goodbye!";
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
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
        return handlerInput.requestEnvelope.request.type === "IntentRequest";
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt("Would you like to try again?")
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
        const speechText = "Sorry, I'm unable to process that request for the moment. Please try again later.";

        return handlerInput.responseBuilder
            .speak(speechText)
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
        CategoryQuizIntentHandler,
        TestQuizIntentHandler,
        AnswerIntentHandler,
        RepeatQuizIntentHandler,
        SearchGeneIntentHandler,
        ExpertAnswerIntentHandler,
        StartExpertAnswerIntentHandler,

        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,

        // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .lambda();