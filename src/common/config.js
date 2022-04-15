const user_code_names_dict = {
    4525: "Jason Pitt",
    7387: "Vinay Warrier",
    81:   "Stephanus Lie",
    219:  "Hannan Wong",
    9727: "Akila Perera"
};

const GENE_QUIZ_PROMPTS_PER_SESSION = 60;
const QUIZ_CEILING_UTTERANCE_COUNT = 5;

module.exports = {
    MELVIN_EXPLORER_ENDPOINT:      process.env.MELVIN_EXPLORER_ENDPOINT,
    MELVIN_EXPLORER_REGION:        process.env.MELVIN_EXPLORER_REGION,
    GENE_QUIZ_API_INVOKE_ROLE:     process.env.GENE_QUIZ_API_INVOKE_ROLE,
    OOV_MAPPER_ENDPOINT:           process.env.OOV_MAPPER_ENDPOINT,
    OOV_MAPPER_REGION:             process.env.OOV_MAPPER_REGION,
    user_code_names_dict,
    GENE_QUIZ_PROMPTS_PER_SESSION: GENE_QUIZ_PROMPTS_PER_SESSION,
    QUIZ_CEILING_UTTERANCE_COUNT
};