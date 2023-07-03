import { APIGatewayProxyResult, S3Event } from "aws-lambda";
import csv from "csv-parser";
import AWS from "aws-sdk";

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
export const handler = async (
  event: S3Event
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("importFileParser lambda", event);
    const records: any[] = [];
    // Process each record in the CSV file
    const processRecord = async (record: any) => {
      // Send the record to SQS
      try {
        if (!process.env.SQS_QUEUE_URL) {
          console.error("SQS_QUEUE_URL is not defined");
          return;
        }
        await sqs
          .sendMessage({
            QueueUrl: process.env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(record),
          })
          .promise();
        console.log("Record sent to SQS:", record);
      } catch (error) {
        console.error("Error while sending record to SQS:", error);
      }
    };

    // Get the S3 bucket and key from the event
    const { bucket, object } = event.Records[0].s3;
    const params = {
      Bucket: bucket.name,
      Key: object.key,
    };

    // Create a readable stream from the S3 object
    console.log("Fetching S3 object:", params);
    const s3Object = await s3.getObject(params).promise();
    console.log("S3 object fetched:", s3Object);
    const s3Stream = s3.getObject(params).createReadStream();

    // Parse the CSV file using csv-parser
    s3Stream
      .pipe(csv())
      .on("data", (data) => {
        console.log("on data", data);
        records.push(data);
      })
      .on("end", async () => {
        // Process each record in the CSV file
        records.forEach(processRecord);

        // Move the file to the 'parsed' folder
        const newKey = object.key.replace("uploaded", "parsed");
        try {
          await s3
            .copyObject({
              Bucket: bucket.name,
              CopySource: `${bucket.name}/${object.key}`,
              Key: newKey,
            })
            .promise();

          // Delete the original file from the 'uploaded' folder
          await s3
            .deleteObject({
              Bucket: bucket.name,
              Key: object.key,
            })
            .promise();

          console.log("File moved to the parsed folder:", newKey);
        } catch (error) {
          console.error("Error while copying/deleting file:", error);
        }
      })
      .on("error", (error) => {
        console.error("Error while parsing CSV:", error);
      });

    return {
      statusCode: 200,
      body: "File processed successfully.",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
