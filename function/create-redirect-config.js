/**
 * S3の各WPのリダイレクト設定ファイルをまとめる
 * 1対1のリダイレクト用と正規表現でのリダイレクトの2ファイルを作成
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const pipeline = util.promisify(stream.pipeline);

const client = new S3Client({});
const bucketName = process.env.REDIRECT_CONFIG_BUCKET;
let singleRedirectRules = {};
let regexRedirectRules = {};

// S3から各WPのリダイレクト設定を取得してまとめる
async function createRedirectConfig() {
    let continuationToken = null;
    let isRegex = false;

    while(true) {
        const listParams = {
            Bucket: bucketName,
            Prefix: 'redirect-config/',
            ContinuationToken: continuationToken,
        };

        const listCommand = new ListObjectsV2Command(listParams);
        const listResponse = await client.send(listCommand);

        if ('Contents' in listResponse) {
            for (const content of listResponse.Contents) {
                if (content.Key.endsWith('regex-redirect-config.json')) {
                    isRegex = true;
                } else if (content.Key.endsWith('redirect-config.json')) {
                    isRegex = true;
                } else {
                    continue;
                }

                const getObjectParams = {
                    Bucket: bucketName,
                    Key: content.Key,
                }
                const getObjectCommand = new GetObjectCommand(getObjectParams);
                const { Body } = await client.send(getObjectCommand);

                // ストリームを使用してデータを読み込み、一時ファイルを作成する
                const tempFilePath = `temp-${Date.now()}.json`;
                await pipeline(Body, fs.createWriteStream(tempFilePath));

                const fileData = JSON.parse(fs.readFileSync(tempFilePath));

                if (isRegex) {
                    regexRedirectRules = { ...regexRedirectRules, ...fileData};
                } else {
                    singleRedirectRules = { ...singleRedirectRules, ...fileData};
                }

                fs.unlinkSync(tempFilePath);
            }
        }


        continuationToken = listResponse.NextContinuationToken;
        if (!continuationToken) {
            break;
        }
    }

    fs.writeFileSync(`function/${process.env.REDIRECT_CONFIG_FILE}`, JSON.stringify(singleRedirectRules, null, 2));
    fs.writeFileSync(`function/${process.env.REGEX_REDIRECT_CONFIG_FILE}`, JSON.stringify(regexRedirectRules, null, 2));
}

createRedirectConfig().catch((error) => {
    console.error(error);
    process.exit(1);
});
