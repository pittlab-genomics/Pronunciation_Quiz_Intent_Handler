const user_code_names_dict = {
    4525: "Jason Pitt",
    7387: "Vinay Warrier",
    81: "Stephanus Lie",
    219: "Hannan Wong",
    9727: "Akila Perera"
};

const GENE_QUIZ_PROMPTS_PER_SESSION = 60;
const QUIZ_CEILING_UTTERANCE_COUNT = 5;

module.exports = {
    melvin_endpoint: process.env.MELVIN_REST_API_ENDPOINT,
    user_code_names_dict,
    GENE_QUIZ_PROMPTS_PER_SESSION: GENE_QUIZ_PROMPTS_PER_SESSION,
    OOV_MAPPER_ENDPOINT: process.env.OOV_MAPPER_ENDPOINT,
    QUIZ_CEILING_UTTERANCE_COUNT
};