const { handler } = require('../index.js')
const fs = require('fs');
const RandExp = require('randexp');

const redirectRule = JSON.parse(fs.readFileSync(`${process.env.REDIRECT_CONFIG_FILE}`, 'utf8'));
const regexRedirectRule = JSON.parse(fs.readFileSync(`${process.env.REGEX_REDIRECT_CONFIG_FILE}`, 'utf8'));

// CloudFrontがLambdaに渡すイベント構造を作成する関数
function createCloudFrontEvent(uri) {
    return {
        "Records": [
            {
                "cf": {
                    "request": {
                        "uri": uri
                    }
                }
            }
        ]
    }
}

describe('リダイレクト用Lambdaの単体テスト', () => {
    // index.htmlが /にリダイレクトするか
    test('/index.htmlが / にリダイレクトするか', (done) => {
        const callback = (error, response) => {
            expect(error).toBeNull();
            expect(response.status).toBe('301');
            expect(response.headers.location[0].value).toBe('/test/');
            done();
        }
        handler(createCloudFrontEvent('/test/index.html'), {}, callback);
    });

    // トレイリングスラッシュがない場合にある版にリダイレクトするか
    test('トレイリングスラッシュなしがありにリダイレクトするか', (done) => {
        const callback = (error, response) => {
            expect(error).toBeNull();
            expect(response.status).toBe('301');
            expect(response.headers.location[0].value).toBe('/test/');
            done();
        }
        handler(createCloudFrontEvent('/test/index.html'), {}, callback);
    });

    // 1対1のリダイレクトルールに含まれるURLがリダイレクトされるか
    console.log(redirectRule);
    const accessUri = Object.keys(redirectRule)[0];
    const destinationUri = redirectRule[accessUri].to;
    const statuscode = redirectRule[accessUri].statuscode.toString();

    test('リダイレクトルールに含まれるURLが正しくリダイレクトされるか', (done) => {
        const callback = (error, response) => {
            expect(error).toBeNull();
            expect(response.status).toBe(statuscode);
            expect(response.headers.location[0].value).toBe(destinationUri);
            done();
        }
        handler(createCloudFrontEvent(accessUri), {}, callback);
    });

    // 正規表現のリダイレクトルールに含まれるURLがリダイレクトされるか
    const regexAccessUri = Object.keys(regexRedirectRule)[0];
    const replace = regexRedirectRule[regexAccessUri].to;
    const regexStatuscode = regexRedirectRule[regexAccessUri].statuscode;

    test('正規表現を使用したリダイレクトルールに含まれるURLが正しくリダイレクトされるか', (done) => {
        const regex = new RegExp(regexAccessUri);
        const randomAccessUri = new RandExp(regex).gen();
        const regexDestinationUri = randomAccessUri.replace(regex, replace);

        const callback = (error, response) => {
            expect(error).toBeNull();
            expect(response.status).toBe(regexStatuscode);
            expect(response.headers.location[0].value).toBe(regexDestinationUri);
            done();
        }
        handler(createCloudFrontEvent(randomAccessUri), {}, callback);
    });

    // index.html以外のファイルがそのままアクセスできるか
    test('index.html以外のファイルがそのままアクセスできるか', (done) => {
        const callback = (error, response) => {
            expect(error).toBeNull();
            expect(response.uri).toBe('/test/test.css');
            done();
        }
        handler(createCloudFrontEvent('/test/test.css'), {}, callback);
    });

    // /でurlが終わる場合、/index.htmlを内部参照するか
    test('/でurlが終わる場合、/index.htmlを内部参照するか', (done) => {
        const callback = (error, response) => {
            expect(error).toBeNull();
            expect(response.uri).toBe('/test/index.html');
            done();
        }
        handler(createCloudFrontEvent('/test/'), {}, callback);
    });
})
