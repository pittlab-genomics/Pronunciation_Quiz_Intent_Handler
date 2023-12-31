#!/bin/bash
set -e

# Passing the stage name as a parameter
stage=${1:-"dev"}

region="eu-west-1"

dir="${BASH_SOURCE%/*}"

service_name="quiz"

declare -a table_list=(
                "gene-utterances"
                "cancer-utterances"
                "expert-utterances"
                "category-utterances"
                )


for i in "${table_list[@]}"
do
    table_name=$service_name-$i-$stage
    printf "Creating table: $table_name \n"

    table_definition_path="$dir/utterance-table-definition.json"
    tmp_table_definition_path="/tmp/_MELVIN_$table_name"
    sed "s/_MELVIN_DYNAMODB_TABLE_NAME/$table_name/g" $table_definition_path > $tmp_table_definition_path

    DYNDB_TABLE_SELECT_OUTPUT=$(aws dynamodb list-tables --region $region | \
        jq --arg table_name "$table_name" '.TableNames[] | select(. == $table_name)')
    # Create table if it does not exist
    if [[ -z $DYNDB_TABLE_SELECT_OUTPUT ]]; then
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
        
        printf "DynamoDB table created: $table_name \n"
    fi
done

printf "Successfully created DynamoDB tables for [$stage] env in [$region] region \n"






