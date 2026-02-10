
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function verify() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("FATAL: NEXT_PUBLIC_GEMINI_API_KEY is not set in environment.");
        process.exit(1);
    }

    console.log("Checking API Key: " + apiKey.substring(0, 8) + "...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending test prompt...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("SUCCESS! Response:", response.text());

    } catch (error) {
        console.error("FAILED to connect to Gemini:", error.message);
        if (error.message.includes("404")) {
            console.error("HINT: The model 'gemini-1.5-flash' might not be enabled or the ID is wrong.");
        }
    }
}

verify();
