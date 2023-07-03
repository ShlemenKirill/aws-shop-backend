import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
      },
    };

    const basicAuthorizer = new NodejsFunction(this, "BasicAuthorizer", {
      ...sharedLambdaProps,
      functionName: "basicAuthorizer",
      entry: "src/handlers/basicAuthorizer.ts",
      environment: {
        ShlemenKirill: process.env.ShlemenKirill!,
      },
    });
  }
}
