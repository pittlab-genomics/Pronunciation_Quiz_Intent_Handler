#!/bin/bash
set -e

# Passing the stage name as a parameter
stage=${1:-"dev"}

region="eu-west-1"

dir="${BASH_SOURCE%/*}"

service_name="quiz"

declare -a table_list=(
                "test-utterances"
                )


for i in "${table_list[@]}"
do
    table_name=$service_name-$i-$stage
    echo "Creating table: $table_name"

    table_definition_path="$dir/utterance-table-definition-test-utterances.json"
    tmp_table_definition_path="/tmp/_MELVIN_$table_name"
    sed "s/_MELVIN_DYNAMODB_TABLE_NAME/$table_name/g" $table_definition_path > $tmp_table_definition_path

    # Trigger table creation
    aws dynamodb create-table --cli-input-json "file://$tmp_table_definition_path" \
        --region $region \
        --billing-mode "PAY_PER_REQUEST"


    # Wait till the table is active
    aws dynamodb wait table-exists --table-name "$table_name" --region $region
    sleep 5s

    aws dynamodb update-continuous-backups \
        --table-name $table_name \
        --region $region \
        --point-in-time-recovery-specification PointInTimeRecoveryEnabled=True
done

printf "Successfully created DynamoDB tables for [$stage] env in [$region] region \n"






