var _ = require('lodash');

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


module.exports = {
    supportsAPL,
    getSlotValues,
    shuffle,
    groupItemsCount,
    groupItemsCountLabeled
}