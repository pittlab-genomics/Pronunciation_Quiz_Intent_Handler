# Serverless Lambda Functions for Melvin Alexa Skill

This serverless project contains AWS Lambda functions for Melvin Alexa skill - genomic explorer based on Alexa Digital Voice Assistant


## How it works

In the Alexa Developer Portal you can add your own skill. To do so you need to define the available intents and then connect them to a Lambda. You can update and define the Lambda with Serverless.

## Setup

In order to deploy the endpoint simply run

```bash
serverless deploy
```

## Test Configuration
sls print -s dev

## Deploy to UAT
sls deploy -s uat

## Test Locally

serverless invoke local --function alexa-skill -p ./examples/SearchGeneIntent_query_payload.json

serverless invoke local --function alexa-skill -p ./examples/GeneQuizIntent_payload.json
serverless invoke local --function alexa-skill -p ./examples/GeneQuizAnswerIntent_payload.json
serverless invoke local --function alexa-skill -p ./examples/GeneQuizStart_payload.json

serverless invoke local --function alexa-skill -p ./examples/TestQuiz_start_payload.json
serverless invoke local --function alexa-skill -p ./examples/TestQuiz_last_utterance_payload.json