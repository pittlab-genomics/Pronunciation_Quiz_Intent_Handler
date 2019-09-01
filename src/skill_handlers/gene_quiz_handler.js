const Speech = require('ssml-builder');
const { quickQueryRepromptText } = require('../common.js');
const { post_gene_utterance } = require('../http_clients/gene_quiz_client.js');
var _ = require('lodash');

const gene_quiz_genes = [
    "TP53",
    "EGFR",
    "ESR1",
    "HIF1A",
    "AKT1",
    "BRCA1",
    "ERBB2",
    "STAT3",
    "KRAS",
    "CDKN2A",
    "BRAF",
    "PPARG",
    "PTEN",
    "AR",
    "CTNNB1",
    "BRCA2",
    "CDH1",
    "MYC",
    "MTOR",
    "BCL2"
];

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

function supportsAPL(handlerInput) {
    const supportedInterfaces = handlerInput.requestEnvelope.context
        .System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface !== undefined;
}

const GeneQuizLaunchIntent = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GeneQuizLaunchIntent';
    },
    handle(handlerInput) {

        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var gene_quiz_item = gene_quiz_genes[Math.floor(Math.random() * gene_quiz_genes.length)];
        sessionAttributes['gene_quiz_item'] = gene_quiz_item;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        let speechText = '';
        let speech = new Speech();
        speech.say("How would you pronounce this gene?");
        const responseBuilder = handlerInput.responseBuilder;
        if (supportsAPL(handlerInput)) {
            responseBuilder.addDirective({
                type: 'Alexa.Presentation.APL.RenderDocument',
                version: '1.0',
                document: APLDocs.gene_quiz,
                datasources: constructGeneQuizAPLDataSource(gene_quiz_item),
            });
        } else {
            responseBuilder.withSimpleCard('Gene Quiz', gene_quiz_item);
            speech.pause('3s');
        }
        speechText = speech.ssml();

        return responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();

    }
};


const GeneQuizAnswerIntent = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GeneQuizAnswerIntent';
    },
    async handle(handlerInput) {
        let gene_name_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.gene.value');
        if (_.isNil(gene_name_utterance)) {
            gene_name_utterance = _.get(handlerInput, 'requestEnvelope.request.intent.slots.gene_query.value');
        }

        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var gene_quiz_item = _.get(sessionAttributes, 'gene_quiz_item');

        let speechText = '';
        let speech = new Speech();


        if (_.isNil(gene_quiz_item)) {
            speech.say("Please start the gene quiz game first.");
            speechText = speech.ssml();
        } else {
            let params = {
                'gene_name': gene_quiz_item,
                'utterance': gene_name_utterance,
                'device_id': _.get(handlerInput, 'requestEnvelope.context.System.device.deviceId'),
                'user_id': _.get(handlerInput, 'requestEnvelope.context.System.user.userId'),
                'session_id': _.get(handlerInput, 'requestEnvelope.session.sessionId'),
                'request_id': _.get(handlerInput, 'requestEnvelope.request.requestId'),
                'intent_timestamp': _.get(handlerInput, 'requestEnvelope.request.timestamp'),
                'request_payload': _.get(handlerInput, 'requestEnvelope')
            };
            try {
                let response = await post_gene_utterance(params);
                console.log(`post_gene_utterance response: ${JSON.stringify(response)}`);
                if (response['data']) {
                    speech.say(`Your response was recorded. Thank you for taking the gene quiz.`);
                    speechText = speech.ssml();

                    // clear the session attribute after successfully recording the response
                    sessionAttributes.gene_quiz_item = null;
                    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                } else if (response['error']) {
                    speech.say(`There was a problem while recording the response. Please try again.`);
                    speechText = speech.ssml();

                } else {
                    speech.say(`Something went wrong. Please try again later.`);
                    speechText = speech.ssml();
                }

            } catch (error) {
                speech.say(`Sorry, I'm unable to process that request for the moment. Please try the gene quiz later.`);
                speechText = speech.ssml();
                console.error(`Intent: ${handlerInput.requestEnvelope.request.intent.name}: message: ${error.message}`, error);
            }
        }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

module.exports = {
    GeneQuizLaunchIntent,
    GeneQuizAnswerIntent
}