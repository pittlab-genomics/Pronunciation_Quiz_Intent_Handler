var _ = require('lodash');

const { user_code_names_dict, QUIZ_PROMPTS_PER_SESSION } = require('./config.js');

const APLDocs = {
    quiz_card: require('../../resources/APL/quiz_card.json'),
};

const supportsAPL = function (handlerInput) {
    const supportedInterfaces = handlerInput.requestEnvelope.context
        .System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface !== undefined;
}

const getSlotValues = function (filledSlots) {
    const slotValues = {};

    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
            filledSlots[item].resolutions &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
            filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case 'ER_SUCCESS_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        ERstatus: 'ER_SUCCESS_MATCH'
                    };
                    break;
                case 'ER_SUCCESS_NO_MATCH':
                    slotValues[name] = {
                        heardAs: filledSlots[item].value,
                        resolved: '',
                        ERstatus: 'ER_SUCCESS_NO_MATCH'
                    };
                    break;
                default:
                    break;
            }
        } else {
            slotValues[name] = {
                heardAs: filledSlots[item].value || '', // may be null 
                resolved: '',
                ERstatus: ''
            };
        }
    }, this);

    return slotValues;
}

/**
* Shuffles array in place. ES6 version
* @param {Array} a items An array containing the items.
*/
const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function groupItemsCount(data, attribute_name) {
    const count_dict = {};
    data.forEach(function (entry) {
        const item = entry[attribute_name];
        if (_.has(count_dict, item)) {
            count_dict[item] += 1;
        } else {
            count_dict[item] = 1; // initial entry for the counter
        }
    });
    return count_dict;
}


function groupItemsCountLabeled(data, attribute_name) {
    const count_dict = {};
    data.forEach(function (entry) {
        const item = entry[attribute_name];
        if (_.has(count_dict, item)) {
            count_dict[item]['utterances_count'] += 1;
        } else {
            count_dict[item] = {
                'utterances_count': 1 // initial entry for the counter
            }
        }
    });
    return count_dict;
}

function populate_display(handlerInput, title, item_text, footer_text) {
    if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
        handlerInput.responseBuilder.withSimpleCard(title, item_text);

    } else {
        item_text = item_text.replace(/\n/g, "<br/>");
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: 'pagerToken',
            version: '1.0',
            document: APLDocs.quiz_card,
            datasources: {
                'templateData': {
                    'title': title,
                    'quiz_item': item_text,
                    'footer_text': footer_text
                },
            },
        });
    }
}

function populate_quiz_display(handlerInput, title, user_code, remaining_count, gene_quiz_item) {
    let user_text = '';
    if (user_code in user_code_names_dict) {
        user_text = `Name: ${user_code_names_dict[user_code]} (ID: ${user_code})`
    } else {
        user_text = `UID: ${user_code}`
    }
    const completed_items = QUIZ_PROMPTS_PER_SESSION - remaining_count;

    if (!supportsAPL(handlerInput)) { // leave some time to read the card when showing in mobile devices
        handlerInput.responseBuilder.withSimpleCard(`Gene Quiz | ${user_text}`,
            `${completed_items}.  ${gene_quiz_item}`);

    } else {
        const footer_text = `${user_text} | Progress: ${completed_items}/${QUIZ_PROMPTS_PER_SESSION}`;
        handlerInput.responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: 'pagerToken',
            version: '1.0',
            document: APLDocs.quiz_card,
            datasources: {
                'templateData': {
                    'title': title,
                    'quiz_item': gene_quiz_item,
                    'footer_text': footer_text
                },
            },
        });
    }
}


module.exports = {
    supportsAPL,
    getSlotValues,
    shuffle,
    groupItemsCount,
    groupItemsCountLabeled,
    populate_quiz_display,
    populate_display
}