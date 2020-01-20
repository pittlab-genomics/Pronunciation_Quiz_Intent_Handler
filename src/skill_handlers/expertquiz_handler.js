const Alexa = require('ask-sdk-core');
const Speech = require('ssml-builder');
var _ = require('lodash');
const utterances_repository = require('../dao/utterances_repository.js');

const ExpertAnswerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ExpertAnswerIntent';
    },
    async handle(handlerInput) {
        console.log("[ExpertAnswerIntentHandler] ASP REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
        const request = handlerInput.requestEnvelope.request;
        const speech = new Speech();
        const responseBuilder = handlerInput.responseBuilder;
        const expert_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.expert.value');

        // if (request.dialogState && request.dialogState !== 'COMPLETED') {
        //     return handlerInput.responseBuilder
        //         .addDelegateDirective(handlerInput.requestEnvelope.request.intent)
        //         .getResponse();
        // }

        // if (!request.dialogState || request.dialogState !== 'COMPLETED') {
        //     console.error(`Invalid state in ExpertAnswerIntentHandler | request: ${JSON.stringify(request)}`);
        //     return responseBuilder
        //         .speak("Please start the expert pronunciation flow first. Bye.")
        //         .getResponse();
        // }

        if (_.isEmpty(expert_utterance)) {
            console.error(`Slot value for expert not found | request: ${JSON.stringify(request)}`);
            return responseBuilder
                .speak("I did not understand the expert pronunciation. Bye.")
                .getResponse();
        }

        let params = {
            'gene_name': 'EXPERT_UTTERANCE_PENDING',
            'utterance': expert_utterance,
            'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
            'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
            'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
            'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
            'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp')
        };

        return utterances_repository.addExpertUtterance(params)
            .then((data) => {
                console.log('Expert utterance saved: ', params);
                speech.say("Okay!");
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText)
                    .getResponse();
            })
            .catch((err) => {
                console.log(`Could not save expert utterance: ${params}`, err);
                speech.say("Sorry, I'm unable to process that request for the moment. Please try again.");
                const speechText = speech.ssml();
                return responseBuilder
                    .speak(speechText)
                    .getResponse();
            });
    }
};

const StartExpertAnswerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ExpertQuizIntent';
    },
    handle(handlerInput) {
        console.log("[StartExpertAnswerIntentHandler] ASP REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
        return handlerInput.responseBuilder
            // .addDelegateDirective({
            //     name: 'ExpertAnswerIntent',
            //     confirmationStatus: 'NONE',
            //     slots: {}
            // })

            .addElicitSlotDirective('expert', {
                name: 'ExpertAnswerIntent',
                confirmationStatus: 'NONE',
                slots: {}
            })
            .speak("start expert")
            .reprompt("reprompt start expert")
            .getResponse();
    }
};

module.exports = {
    ExpertAnswerIntentHandler,
    StartExpertAnswerIntentHandler
}