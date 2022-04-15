const {
    STSClient, AssumeRoleCommand
} = require("@aws-sdk/client-sts");
const { HttpRequest } = require("@aws-sdk/protocol-http");
const { SignatureV4 } = require("@aws-sdk/signature-v4");
const { Sha256 } = require("@aws-crypto/sha256-browser");

async function assume_role(role_arn, role_session) {
    const client = new STSClient({ region: process.env.REGION });
    const command = new AssumeRoleCommand({
        RoleArn:         role_arn,
        RoleSessionName: role_session
    });
    try {
        const data = await client.send(command);
        console.debug(`[sigv4_utils] Assumed role: ${role_arn} for session: ${role_session} `);
        return data;
    } catch (err) {
        console.error(`[sigv4_utils] Failed to assume role: ${role_arn} for session: ${role_session} `);
        throw err;
    }
}


function get_creds_data(creds_provider) {
    if (creds_provider.attributesManager) {
        const sessionAttributes = creds_provider.attributesManager.getSessionAttributes();
        if (sessionAttributes["GENE_QUIZ.STS.CREDENTIALS"]) {
            return sessionAttributes["GENE_QUIZ.STS.CREDENTIALS"];
        }
    }
    return creds_provider;
}

function paramsToObject(entries) {
    const result = {};
    for (const [key, value] of entries) {
        result[key] = value;
    }
    return result;
}


async function sign_request(url, region, creds_provider, presigned = false, method = "GET", expiry_timeout = 43200) {
    if (presigned) {
        url.searchParams.set("X-Amz-Expires", expiry_timeout);
    }
    const cred_data = get_creds_data(creds_provider);
    if (cred_data.Credentials) {
        const creds = {
            accessKeyId:     cred_data.Credentials.AccessKeyId,
            secretAccessKey: cred_data.Credentials.SecretAccessKey,
            sessionToken:    cred_data.Credentials.SessionToken
        };
        const request = new HttpRequest({
            headers: {
                "X-Amz-Expires": String(expiry_timeout),
                "host":          url.host
            },
            hostname: url.host,
            method:   method,
            path:     url.pathname,
            query:    paramsToObject(url.searchParams.entries())
        });
        const signer = new SignatureV4({
            credentials: creds,
            region:      region,
            service:     "execute-api",
            sha256:      Sha256
        });

        const signed_req = await signer.sign(request);
        return signed_req;
    } else {
        throw new Error("[sigv4_utils] credentials missing");
    }
}

function build_presigned_url(signed_req) {
    return "https://" + signed_req.host + signed_req.path;
}

module.exports = {
    sign_request, assume_role, build_presigned_url
};