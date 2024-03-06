'use strict';
export function handler(event, context, callback) {
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
    }
    // URLの末尾が / で終わる場合、/index.htmlを参照する
    else if (uri.endsWith('/')) {
        request.uri += 'index.html';

        callback(null, request);
    } else {
        callback(null, request);
    }
}
