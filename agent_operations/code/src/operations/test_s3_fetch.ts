import axios from 'axios';
import logger from "../common/utils/logger";

async function testS3Fetch() {
    const testUrl = "https://devrev-prod-artifacts.s3.dualstack.us-east-1.amazonaws.com/wuA-RcUfeDXSycso6s0Wng?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIARI5P5QQABR3STM4S%2F20241227%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241227T123349Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&response-cache-control=max-age%3D31536000&response-content-disposition=inline%3B%20filename%2A%3DUTF-8%27%27PRD%252FBRD%2520Template&X-Amz-Signature=74f6443874ab3796044d66a540345b9b810b6d9478a6bf353820d663db1db13a";
    
    try {
        logger.info('Fetching content...');
        const response = await axios.get(testUrl, {
            responseType: 'text',
            headers: {
                'Accept': '*/*'
            }
        });
        
        // Log safe response data
        logger.info('Response status: ' + response.status);
        logger.info('Content type: ' + response.headers['content-type']);
        logger.info('Data preview: ' + response.data.substring(0, 200) + '...');
        
    } catch (error) {
        logger.error('Error details:', {
            message: error,
            status: error,
            statusText: error
        });
    }
}

// Execute the test
testS3Fetch(); 