// check_lambda_status.js
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({region: 'us-east-1'});
const functionArn = process.env.FUNCTION_ARN;

async function checkLambdaStatus() {
    try {
        const data = await lambda.getFunction({
            FunctionName: functionArn,
        }).promise();

        if (data.Configuration.State === 'Active') {
            console.log('Function is active.');
            return true;
        } else {
            console.log('Function status is', data.Configuration.State);
            return false;
        }
    } catch (error) {
        console.error('Error getting function status:', error);
        throw error;
    }
}

(async () => {
    // 更新したLambda関数のステータスがActiveになるまで待つ(10秒間隔)
    while (!await checkLambdaStatus()) {
        console.log('Waiting for function to become active...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
})();
