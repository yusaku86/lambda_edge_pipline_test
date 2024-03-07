const { LambdaClient, GetFunctionCommand } = require("@aws-sdk/client-lambda");
const client = new LambdaClient({ region: "us-east-1" });
const functionArn = process.env.FUNCTION_ARN;

async function checkLambdaStatus() {
    try {
        const command = new GetFunctionCommand({
            FunctionName: functionArn,
        });

        const data = await client.send(command);

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
