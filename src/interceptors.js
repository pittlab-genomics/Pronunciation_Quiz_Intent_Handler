const _ = require("lodash");

const { assume_role } = require("./utils/sigv4_utils");
const { GENE_QUIZ_API_INVOKE_ROLE } = require("./common/config");


const RequestLogInterceptor = { process(handlerInput) {
    console.log("ASP REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
} };

const ResponseLogInterceptor = { process(handlerInput) {
    console.log(`ASP RESPONSE = ${JSON.stringify(handlerInput.responseBuilder.getResponse())}`);
}, };

const STSCredentialsInterceptor = { async process(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const request_id = _.get(handlerInput, "requestEnvelope.request.requestId");
    if (!sessionAttributes["GENE_QUIZ.STS.CREDENTIALS"]) {
        console.info(`[STSCredentialsInterceptor] Assuming IAM role ${GENE_QUIZ_API_INVOKE_ROLE}`);
        sessionAttributes["GENE_QUIZ.STS.CREDENTIALS"] = await assume_role(GENE_QUIZ_API_INVOKE_ROLE, request_id);
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    }
} };

module.exports = {
    RequestLogInterceptor,
    ResponseLogInterceptor,
    STSCredentialsInterceptor
};