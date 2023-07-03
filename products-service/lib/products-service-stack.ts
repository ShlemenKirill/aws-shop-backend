import "dotenv/config";
import * as cdk from "aws-cdk-lib";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { aws_cloudfront, aws_iam } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { BucketAccessControl } from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { BlockPublicAccess } from "@aws-cdk/aws-s3";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS topic
    const createProductTopic = new sns.Topic(this, "CreateProductTopic");

    // Create email subscription for the SNS topic with filter policy
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(process.env.EMAIL_ADDRESS!, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            lessThanOrEqualTo: 500,
          }),
        },
      })
    );

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(process.env.SECOND_EMAIL_ADDRESS!, {
        filterPolicy: {
          price: sns.SubscriptionFilter.numericFilter({
            greaterThan: 500,
          }),
        },
      })
    );

    const sharedLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
      },
    };

    // Import existing DynamoDB table
    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      `aws_shop_products`
    );

    const getProductsList = new NodejsFunction(this, "GetProductsList", {
      ...sharedLambdaProps,
      functionName: "getProductsList",
      entry: "src/handlers/getProductsList.ts",
      environment: {
        TABLE_NAME: productsTable.tableName,
        DB_USER: process.env.DB_USER!,
        DB_HOST: process.env.DB_HOST!,
        DB_NAME: process.env.DB_NAME!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
      },
    });

    const getProductById = new NodejsFunction(this, "GetProductById", {
      ...sharedLambdaProps,
      functionName: "getProductById",
      entry: "src/handlers/getProductById.ts",
      environment: {
        TABLE_NAME: productsTable.tableName,
        DB_USER: process.env.DB_USER!,
        DB_HOST: process.env.DB_HOST!,
        DB_NAME: process.env.DB_NAME!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
      },
    });

    const createProduct = new NodejsFunction(this, "CreateProduct", {
      ...sharedLambdaProps,
      functionName: "createProduct",
      entry: "src/handlers/createProduct.ts",
      environment: {
        TABLE_NAME: productsTable.tableName,
        DB_USER: process.env.DB_USER!,
        DB_HOST: process.env.DB_HOST!,
        DB_NAME: process.env.DB_NAME!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
      },
    });

    const catalogBatchProcess = new NodejsFunction(
      this,
      "CatalogBatchProcess",
      {
        ...sharedLambdaProps,
        functionName: "catalogBatchProcess",
        entry: "src/handlers/catalogBatchProcess.ts",
        environment: {
          TABLE_NAME: productsTable.tableName,
          DB_USER: process.env.DB_USER!,
          DB_HOST: process.env.DB_HOST!,
          DB_NAME: process.env.DB_NAME!,
          DB_PASSWORD: process.env.DB_PASSWORD!,
        },
      }
    );

    const api = new apiGateway.HttpApi(this, "ProductApi", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: [apiGateway.CorsHttpMethod.ANY],
      },
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        getProductsList
      ),
      path: "/products",
      methods: [apiGateway.HttpMethod.GET],
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        getProductById
      ),
      path: "/products/{id}",
      methods: [apiGateway.HttpMethod.GET],
    });

    api.addRoutes({
      integration: new HttpLambdaIntegration(
        "GetProductsListIntegration",
        createProduct
      ),
      path: "/products",
      methods: [apiGateway.HttpMethod.POST],
    });

    // Swagger docs deploying
    const cloudFrontOAI = new aws_cloudfront.OriginAccessIdentity(
      this,
      "E2XIYPV8ESFQTF"
    );
    // Create S3 Bucket
    const bucket = new s3.Bucket(this, "ProductsServiceSwaggerBucket", {
      websiteIndexDocument: "swaggerUI.html",
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        actions: ["s3:GetObject"],
        effect: aws_iam.Effect.ALLOW,
        principals: [
          new aws_iam.CanonicalUserPrincipal(
            cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
        resources: [bucket.arnForObjects("*")],
      })
    );

    // Create CloudFront Distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "ProductsServiceSwaggerDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: cloudFrontOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    // Deploy React app to S3 Bucket
    new s3deploy.BucketDeployment(this, "ProductsServiceSwaggerDeployment", {
      sources: [s3deploy.Source.asset("./src/swagger")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // Create the SQS queue
    const queue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
    });
    // Configure the SQS event source mapping for the Lambda function
    catalogBatchProcess.addEventSource(
      new SqsEventSource(queue, { batchSize: 5 })
    );

    // Grant necessary permissions
    queue.grantSendMessages(catalogBatchProcess);
    queue.grantConsumeMessages(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);

    // Publish event to SNS topic after creating products
    catalogBatchProcess.addEnvironment(
      "SNS_TOPIC_ARN",
      createProductTopic.topicArn
    );
    // Publish event to SNS topic after creating products
    const snsPublishPermission = new aws_iam.PolicyStatement({
      actions: ["sns:Publish"],
      resources: [createProductTopic.topicArn],
    });
    catalogBatchProcess.addToRolePolicy(snsPublishPermission);
  }
}
