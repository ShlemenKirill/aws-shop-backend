import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
      },
    };

    // Import existing DynamoDB table
    const productsTable = dynamodb.Table.fromTableName(this, 'ProductsTable', `aws_shop_products`);

    const getProductsList = new NodejsFunction(this, "GetProductsList", {
      ...sharedLambdaProps,
      functionName: "getProductsList",
      entry: "src/handlers/getProductsList.ts",
      environment: {
        TABLE_NAME: productsTable.tableName
      }
    });

    const getProductById = new NodejsFunction(this, "GetProductById", {
      ...sharedLambdaProps,
      functionName: "getProductById",
      entry: "src/handlers/getProductById.ts",
      environment: {
        TABLE_NAME: productsTable.tableName
      }
    });

    const createProduct = new NodejsFunction(this, "CreateProduct", {
      ...sharedLambdaProps,
      functionName: "createProduct",
      entry: "src/handlers/createProduct.ts",
      environment: {
        TABLE_NAME: productsTable.tableName
      }
    });

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
  }
}
