const _ = require("lodash");
const {
    gene_quiz_response_builder,
    cancer_quiz_response_builder,
    category_quiz_response_builder,
    test_quiz_response_builder,
    process_gene_quiz_answer,
    process_cancer_quiz_answer,
    process_category_quiz_answer,
    process_test_quiz_answer
} = require("./quiz_helper.js");

const { getSlotValues } = require("../common/util.js");


const UserIdentifierIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "UserIdentifierIntent";
    },
    async handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const responseBuilder = handlerInput.responseBuilder;
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        if (!_.has(sessionAttributes, "quiz_referrer")) { // validation check - make sure the req is from a start intent
            return responseBuilder
                .speak("I couldn't hear your answer. Please try again.")
                .getResponse();
        }

        if (_.get(request, "dialogState") !== "COMPLETED") { // delegate to Alexa to collect all the required slots 
            return handlerInput.responseBuilder
                .addDelegateDirective(request.intent)
                .getResponse();

        }
        // drop flag attribute after validation check and dialog management is complete
        delete sessionAttributes["quiz_referrer"]; 

        const slotValues = getSlotValues(request.intent.slots);
        console.log("***** UserIdentifierIntent slotValues: " + JSON.stringify(slotValues, null, 2));

        const quiz = _.get(sessionAttributes, "quiz");
        let quizResponse = {};

        if (slotValues.user_identifier.heardAs && quiz) {
            const user_code = slotValues.user_identifier.heardAs;
            sessionAttributes["user_code"] = parseInt(user_code, 10);

            // remove gene_list if already populated (this is a new quiz round)
            // this scenario could happen if a user decides to change the user code given previously
            if (_.has(sessionAttributes, "gene_list")) {
                delete sessionAttributes["gene_list"];
            }
            handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

            if (quiz === "GENE_QUIZ") {
                quizResponse = await gene_quiz_response_builder(handlerInput);

            } else if (quiz === "CANCER_QUIZ") {
                quizResponse = await cancer_quiz_response_builder(handlerInput);

            } else if (quiz === "CATEGORY_QUIZ") {
                quizResponse = await category_quiz_response_builder(handlerInput);

            } else {
                console.error("[UserIdentifierIntentHandler] session attribute quiz is invalid: " +
                `${JSON.stringify(handlerInput.requestEnvelope)}`);
                return responseBuilder
                    .speak("Please start a quiz first.")
                    .getResponse();
            }

            return responseBuilder
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

const RepeatQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "RepeatQuizIntent";
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const responseBuilder = handlerInput.responseBuilder;
        const quiz = _.get(sessionAttributes, "quiz");
        let quizResponse = {};
        console.info(`[RepeatQuizIntentHandler] quiz: ${JSON.stringify(quiz)}`);

        if (quiz === "GENE_QUIZ") {
            quizResponse = await gene_quiz_response_builder(handlerInput, true);

        } else if (quiz === "CANCER_QUIZ") {
            quizResponse = await cancer_quiz_response_builder(handlerInput, true);

        } else if (quiz === "CATEGORY_QUIZ") {
            quizResponse = await cancer_quiz_response_builder(handlerInput, true);

        } else {
            console.error("[RepeatQuizIntentHandler] session attribute quiz is invalid: " + 
            `${JSON.stringify(handlerInput.requestEnvelope)}`);
            return responseBuilder
                .speak("Please start a quiz first.")
                .getResponse();
        }

        return responseBuilder
            .speak(quizResponse.speechText)
            .reprompt(quizResponse.repromptText)
            .getResponse();
    }
};

const GeneQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "GeneQuizIntent";
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes["quiz"] = "GENE_QUIZ";
        sessionAttributes["quiz_referrer"] = "GeneQuizIntent";
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
            .addElicitSlotDirective("user_identifier", {
                name:               "UserIdentifierIntent",
                confirmationStatus: "NONE",
                slots:              {}
            })
            .speak("Ok, let's play the gene quiz. What is your identification code?")
            .reprompt("Please provide your four-digit user identification code.")
            .getResponse();
    }
};

const CancerQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "CancerQuizIntent";
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes["quiz"] = "CANCER_QUIZ";
        sessionAttributes["quiz_referrer"] = "CancerQuizIntent";
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
            .addElicitSlotDirective("user_identifier", {
                name:               "UserIdentifierIntent",
                confirmationStatus: "NONE",
                slots:              {}
            })
            .speak("Ok, let's play the cancer quiz. What is your identification code?")
            .reprompt("Please provide your four-digit user identification code.")
            .getResponse();
    }
};

const CategoryQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "CategoryQuizIntent";
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes["quiz"] = "CATEGORY_QUIZ";
        sessionAttributes["quiz_referrer"] = "CategoryQuizIntent";
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
            .addElicitSlotDirective("user_identifier", {
                name:               "UserIdentifierIntent",
                confirmationStatus: "NONE",
                slots:              {}
            })
            .speak("Ok, let's play the category quiz. What is your identification code?")
            .reprompt("Please provide your four-digit user identification code.")
            .getResponse();
    }
};

const TestQuizIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "TestQuizIntent";
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        sessionAttributes["quiz"] = "TEST_QUIZ";
        sessionAttributes["quiz_referrer"] = "TestQuizIntent";
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        const quizResponse = test_quiz_response_builder(handlerInput);
        return handlerInput.responseBuilder
            .speak(quizResponse.speechText)
            .reprompt(quizResponse.repromptText)
            .getResponse();
    }
};

const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === "IntentRequest"
            && handlerInput.requestEnvelope.request.intent.name === "AnswerIntent";
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const responseBuilder = handlerInput.responseBuilder;
        const quiz = _.get(sessionAttributes, "quiz");
        console.info(`[AnswerIntentHandler] quiz: ${JSON.stringify(quiz)}`);

        if (quiz === "GENE_QUIZ") {
            await process_gene_quiz_answer(handlerInput);

        } else if (quiz === "CANCER_QUIZ") {
            await process_cancer_quiz_answer(handlerInput);

        } else if (quiz === "CATEGORY_QUIZ") {
            await process_category_quiz_answer(handlerInput);

        } else if (quiz === "TEST_QUIZ") {
            await process_test_quiz_answer(handlerInput);

        } else {
            console.error(`Session attribute quiz is not set: ${JSON.stringify(handlerInput.requestEnvelope)}`);
            return handlerInput.responseBuilder
                .speak("Please start a quiz first.");
        }
        return responseBuilder.getResponse();
    }
};

module.exports = {
    GeneQuizIntentHandler,
    CancerQuizIntentHandler,
    CategoryQuizIntentHandler,
    TestQuizIntentHandler,
    AnswerIntentHandler,
    UserIdentifierIntentHandler,
    RepeatQuizIntentHandler
};
