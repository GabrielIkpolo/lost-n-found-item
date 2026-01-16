import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// 1. Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 2. Load .env variables
dotenv.config({ path: path.join(rootDir, '.env') });

// 3. Read the template
const templatePath = path.join(rootDir, 'firebase-messaging-sw.template.js');
const outputPath = path.join(rootDir, 'public', 'firebase-messaging-sw.js');

let swContent = fs.readFileSync(templatePath, 'utf8');

// 4. Replace placeholders with Env Vars
const keysToReplace = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

keysToReplace.forEach(key => {
    const value = process.env[key];
    if (!value) {
        console.warn(`⚠️ Warning: ${key} is missing in .env file`);
    }
    // Replace ${VARIABLE_NAME} with actual value
    swContent = swContent.replace(`\${${key}}`, value || '');
});

// 5. Write the final file to public/
fs.writeFileSync(outputPath, swContent);

console.log('✅ firebase-messaging-sw.js generated successfully with environment variables.');