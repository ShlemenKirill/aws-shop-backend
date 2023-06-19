import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        const fileName = event.queryStringParameters?.name;
        const s3Params = {
            Bucket: process.env.BUCKET_NAME,
            Key: `uploaded/${fileName}`,
            Expires: 60, // URL expiration time in seconds
            ContentType: 'text/csv'
        };

        // Generate the signed URL
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const signedUrl = await s3.getSignedUrlPromise('putObject', s3Params);

        return {
            statusCode: 200,
            body: signedUrl
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error'
        };
    }
};
