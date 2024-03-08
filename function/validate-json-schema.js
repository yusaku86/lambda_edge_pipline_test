/**
 * リダイレクト設定を記述したjsonファイルのスキーマが正しいか判定
 */

const fs = require('fs');
const Ajv = require('ajv');
const ajv = new Ajv();

// リダイレクト設定読み込み
const redirectRule = JSON.parse(fs.readFileSync(`function/${process.env.REDIRECT_CONFIG_FILE}`, 'utf8'));
const regexRedirectRule = JSON.parse(fs.readFileSync(`function/${process.env.REGEX_REDIRECT_CONFIG_FILE}`, 'utf8'));

const schema = {
    "type": "object",
    "additionalProperties": {
        "type": "object",
        "properties": {
            "to": { "type": "string" },
            "statuscode": { "type": "integer" }
        },
        "required": [
            "to",
            "statuscode"
        ]
    }
}

const validator = ajv.compile(schema);

// リダイレクト設定が空か、スキーマに準拠している場合
if ((validator(redirectRule) || Object.keys(redirectRule).length === 0) && (validator(regexRedirectRule) || Object.keys(regexRedirectRule).length === 0)) {
    console.log("リダイレクト設定のJSON形式は有効です。")
} else {
    console.error('リダイレクト設定のJSON形式は無効です:', validate.errors);
    process.exit(1);
}
