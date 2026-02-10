
const { GoogleGenAI } = require('@google/genai');

// Polyfill fetch for Node environment if needed
// Node 18+ has fetch built-in.

async function list() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in env");
        return;
    }
    console.log("Using API Key:", apiKey.substring(0, 10) + "...");

    try {
        const ai = new GoogleGenAI({ apiKey });
        // Attempt to just generate content with 'gemini-1.5-flash' to verify if it works
        // or try to find a listModels method if available in this SDK.
        // The @google/genai SDK might not have listModels exposed easily in the main class?
        // Let's try to infer from error or straight generation.

        console.log("Attempting `gemini-1.5-flash`...");
        try {
            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent("Test");
            console.log("SUCCESS: gemini-1.5-flash works.");
            console.log("Response:", result.response.text());
            return;
        } catch (e) {
            console.error("Failed gemini-1.5-flash:", e.message);
        }

        console.log("Attempting `gemini-pro`...");
        try {
            const model = ai.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent("Test");
            console.log("SUCCESS: gemini-pro works.");
            return;
        } catch (e) {
            console.error("Failed gemini-pro:", e.message);
        }

    } catch (e) {
        console.error("Fatal error:", e);
    }
}

list();
