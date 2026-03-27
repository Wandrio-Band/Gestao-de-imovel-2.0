import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = "AIzaSyB2ZW5L-AjlD5lDXb7Fu1cr16biB2vJhq8";

if (!apiKey) {
    console.error("API Key missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Fetching available models...");
        // Use raw fetch to list models since getGenerativeModel doesn't list them
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(`- ${m.name} (supports generateContent: ${m.supportedGenerationMethods.includes('generateContent')})`));
        } else {
            console.log("Error fetching models:", data);
        }
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
