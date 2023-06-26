import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as s3notificaitions from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
      },
    };

    // Create the S3 bucket
    const bucket = new s3.Bucket(this, "ImportFileBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ["*"],
          exposedHeaders: [],
        },
      ],
    });

    // Create the Lambda function
    const importProductsFile = new NodejsFunction(this, "ImportProductsFile", {
      ...sharedLambdaProps,
      functionName: "importProductsFile",
      entry: "src/handlers/importProductsFile.ts",
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const queue = sqs.Queue.fromQueueArn(
      this,
      "CatalogItemsQueue",
      `arn:aws:sqs:eu-central-1:195262312472:catalogItemsQueue`
    );

    const importFileParcer = new NodejsFunction(this, "ImportFileParcer", {
      ...sharedLambdaProps,
      functionName: "importFileParcer",
      entry: "src/handlers/importFileParcer.ts",
      environment: {
        BUCKET_NAME: bucket.bucketName,
        SQS_QUEUE_URL: queue.queueUrl,
      },
    });

    queue.grantSendMessages(importFileParcer);

    // Grant the Lambda function read/write access to the S3 bucket
    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParcer);
    bucket.grantDelete(importFileParcer);

    // Create the API Gateway
    const api = new apiGateway.HttpApi(this, "ImportApi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });

    // Create the Lambda integration
    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "ImportFileIntegration",
        importProductsFile
      ),
      path: "/import",
      methods: [apiGateway.HttpMethod.GET],
    });

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notificaitions.LambdaDestination(importFileParcer),
      { prefix: "uploaded" }
    );
  }
}
