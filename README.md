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

serverless invoke local --function alexa-skill -p ./examples/GeneQuizIntent_payload.json
serverless invoke local --function alexa-skill -p ./examples/GeneQuizAnswerIntent_payload.json
serverless invoke local --function alexa-skill -p ./examples/GeneQuizStart_payload.json
serverless invoke local --function alexa-skill -p ./examples/GeneQuizStart_train_payload.json
serverless invoke local --function alexa-skill -p ./examples/GeneQuiz_repeat_utterance_payload.json

serverless invoke local --function alexa-skill -p ./examples/CancerQuiz_start_payload.json
serverless invoke local --function alexa-skill -p ./examples/CancerQuiz_last_utterance_payload.json
serverless invoke local --function alexa-skill -p ./examples/CancerQuiz_repeat_utterance_payload.json

serverless invoke local --function alexa-skill -p ./examples/CategoryQuiz_start_payload.json
serverless invoke local --function alexa-skill -p ./examples/CategoryQuiz_last_utterance_payload.json
serverless invoke local --function alexa-skill -p ./examples/CategoryQuiz_repeat_utterance_payload.json

serverless invoke local --function alexa-skill -p ./examples/TestQuiz_start_payload.json
serverless invoke local --function alexa-skill -p ./examples/TestQuiz_last_utterance_payload.json

### Dashboard functions
serverless invoke local --function dashboard_stats
serverless invoke local --function dashboard_stats --data '{"queryStringParameters":{"start":"1579333013000"}}'
serverless invoke local --function dashboard_stats --data '{"queryStringParameters":{"start_date": "2020-01-19"}}'

serverless invoke local --function gene_utterances_list
serverless invoke local --function gene_utterances_list --data '{"queryStringParameters":{"gene_list": "CCDS"}}'

serverless invoke local --function gene_utterances_stats
serverless invoke local --function gene_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19"}}'
serverless invoke local --function gene_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19", "gene_list": "CCDS"}}'
serverless invoke local --function gene_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19", "gene_list": "GENERIF"}}'
serverless invoke local --function gene_utterances_stats --data '{"queryStringParameters":{"user_code": "0000"}}'
serverless invoke local --function gene_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19", "user_code": "0000"}}'


serverless invoke local --function cancer_utterances_list

serverless invoke local --function cancer_utterances_stats
serverless invoke local --function cancer_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19"}}'
serverless invoke local --function cancer_utterances_stats --data '{"queryStringParameters":{"user_code": "0000"}}'
serverless invoke local --function cancer_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19", "user_code": "0000"}}'


serverless invoke local --function category_utterances_list

serverless invoke local --function category_utterances_stats
serverless invoke local --function category_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19"}}'
serverless invoke local --function category_utterances_stats --data '{"queryStringParameters":{"user_code": "0000"}}'
serverless invoke local --function category_utterances_stats --data '{"queryStringParameters":{"start_date": "2020-01-19", "user_code": "0000"}}'