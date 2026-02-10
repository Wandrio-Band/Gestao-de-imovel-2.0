
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testConnection() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No API Key found in .env");
        process.exit(1);
    }

    console.log(`🔑 Testing API Key: ${apiKey.substring(0, 5)}...`);
    console.log("📚 Library: @google/generative-ai");
    console.log("🤖 Model: gemini-1.5-flash-001");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const result = await model.generateContent("Respond with 'OK' if you can read this.");
        const response = await result.response;
        const text = response.text();

        console.log(`✅ SUCCESS! AI Responded: "${text.trim()}"`);
        console.log("The system is correctly configured.");

    } catch (error) {
        console.error("❌ FAILURE:", error.message);
        if (error.message.includes("404")) {
            console.error("👉 Error 404 means the model name is wrong or the key doesn't have access.");
        } else if (error.message.includes("400")) {
            console.error("👉 Error 400 usually means invalid argument or API key issues.");
        }
    }
}

testConnection();
