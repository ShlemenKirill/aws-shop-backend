import { APIGatewayProxyEvent } from "aws-lambda";
export const handler = (event: APIGatewayProxyEvent) => {
  console.log("event:", event);
  const authorizationToken = event.headers?.Authorization;
  if (!authorizationToken) {
    return {
      statusCode: 401,
      body: "Authorization header is not provided",
    };
  }
  console.log("authorizationToken:", authorizationToken);
  const encodedCredentials = authorizationToken.split(" ")[1];
  console.log("encodedCredentials:", encodedCredentials);
  const decodedCredentials = Buffer.from(encodedCredentials, "base64").toString(
    "utf-8"
  );
  console.log("decodedCredentials:", decodedCredentials);
  const [username, password] = decodedCredentials.split(":");
  console.log("username:", username, "password:", password);
  const testPassword = process.env.ShlemenKirill || "";
  console.log("testPassword:", testPassword);
  if (password !== testPassword) {
    return {
      statusCode: 403,
      body: "Access denied",
    };
  }

  return {
    statusCode: 200,
    body: "Authorization successful",
  };
};
