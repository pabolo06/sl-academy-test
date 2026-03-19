import { AppDeployClient } from '@appdeploy/sdk';
import * as fs from 'fs';
import * as path from 'path';

async function runDeploy() {
    const apiKey = 'ak_efe2ace5620cb12a3853d11d87e968ba0b1bc79068162ea53de63bf45bf5c670';
    const appId = '3c71215371174476a6';

    const client = new AppDeployClient({ apiKey });

    const content = fs.readFileSync(path.join('frontend', 'out', 'index.html'), 'utf-8');

    console.log(`Starting official SDK deploy for ${appId}...`);

    try {
        const result = await client.deployApp({
            appId: appId,
            appType: 'frontend-only',
            files: [{
                filename: 'index.html',
                content: content
            }],
            model: 'gemini-2.0-pro',
            intent: 'HUB-ZERO FINAL STABILIZATION'
        });

        console.log('Deploy successful:', result);
    } catch (error) {
        console.error('Deploy failed:', error);
    }
}

runDeploy();
