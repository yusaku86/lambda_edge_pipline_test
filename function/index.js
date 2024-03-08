'use strict';
const fs = require('fs');

// リダイレクトルールのファイル読み込み
const redirectRules = JSON.parse(fs.readFileSync('redirect-config.json', 'utf8'));
const regexRedirectRules = JSON.parse(fs.readFileSync('regex-redirect-config.json', 'utf8'));

// ステータスメッセージ
const statusMessage = {
    "301": "Moved Permanently",
    "302": "Found"
}

const filePattern = /.*\.[^\/]*$/;

const endsWithSlash = /\/$/;

exports.handler = async (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const uri = request.uri;

    // /index.htmlへのアクセスの場合 => /にリダイレクト
    if (uri.endsWith('/index.html')) {
        const newUri = uri.replace(/\/index\.html$/, '/');
        const response = {
            status: '301',
            statusDescription: 'Moved Permanently',
            headers: {
                'location': [{
                    key: 'Location',
                    value: newUri,
                }],
                'cache-control': [{
                    key: 'Cache-Control',
                    value: "max-age=3600"
                }],
            },
        };
        callback(null, response);
        return;
    }
    // index.html以外のファイルの場合
    else if (filePattern.test(uri)) {
        callback(null, request);
        return;
    }
    // ファイル以外でトレイリングスラッシュがない場合
    else if (!endsWithSlash.test(uri)) {
        const response = {
            status: '301',
            statusDescription: 'Moved Permanently',
            headers: {
                'location': [{
                    key: 'Location',
                    value: uri + '/',
                }],
                'cache-control': [{
                    key: 'Cache-Control',
                    value: "max-age=3600"
                }],
            },
        };
        callback(null, response);
        return;
    }
    // 1対1のリダイレクトルールに含まれる場合
    else if(redirectRules[uri]) {
        const statuscode = redirectRules[uri].statuscode.toString();

        const response = {
            status: statuscode,
            statusDescription: statusMessage[statuscode],
            headers: {
                'location': [{
                    key: 'Location',
                    value: redirectRules[uri].to
                }]
            }
        };
        callback(null, response);
        return;
    }
    // 正規表現を使用したリダイレクトルールに含まれる場合
    for (const rule in regexRedirectRules) {
        const regex = new RegExp(rule);
        if (regex.test(uri)) {
            const statuscode = regexRedirectRules[rule].statuscode.toString();
            const response = {
                status: statuscode,
                statusDescription: statusMessage[statuscode],
                headers: {
                    'location': [{
                        key: 'Location',
                        value: uri.replace(regex, regexRedirectRules[rule].to)
                    }]
                }
            };
            callback(null, response);
            return;
        }
    }
    // URLの末尾が / で終わる場合、/index.htmlを参照する
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
        callback(null, request);
        return;
    } else {
        callback(null, request);
        return;
    }
}
