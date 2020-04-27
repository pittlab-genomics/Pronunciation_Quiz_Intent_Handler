const user_code_names_dict = {
    4525: "Jason Pitt",
    7387: "Vinay Warrier",
    81: "Stephanus Lie",
    219: "Hannan Wong",
    9727: "Akila Perera"
};

const QUIZ_PROMPTS_PER_SESSION = 60;

module.exports = {
    melvin_endpoint: process.env.MELVIN_REST_API_ENDPOINT,
    user_code_names_dict,
    QUIZ_PROMPTS_PER_SESSION
}