export const buildResponse = (statusCode: number, body: { [key: string]: any }) => {
    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*'
        },
        body: JSON.stringify(body)
    }
}
