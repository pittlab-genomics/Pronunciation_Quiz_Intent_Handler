const Speech = require('ssml-builder');
var _ = require('lodash');
const { supportsAPL } = require("../common/util.js")

const APLDocs = {
    image_viewer: require('../documents/image_viewer.json'),
};

const ImageViewerIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ImageViewerIntent';
    },
    handle(handlerInput) {
        const speechText = 'This is the image viewer template!';

        if (!supportsAPL(handlerInput)) {
            return handlerInput.responseBuilder
                .speak('This is an echo device without a screen!')
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                token: 'pagerToken',
                version: '1.0',
                document: APLDocs.image_viewer,
                datasources: {
                    'pagerTemplateData': {
                        'type': 'object',
                        'properties': {
                            'hintString': 'This is a plot!',
                        }
                    },
                },
            })
            .addDirective({
                type: 'Alexa.Presentation.APL.ExecuteCommands',
                token: 'pagerToken',
                commands: [
                    {
                        'type': 'AutoPage',
                        'componentId': 'pagerComponentId',
                        'duration': 5000,
                    },
                ],
            })
            .getResponse();
    },
};

module.exports = {
    ImageViewerIntentHandler
}