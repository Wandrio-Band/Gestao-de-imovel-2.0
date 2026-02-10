const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyBvjtABtc5FbXcH_HoSDriby2nXmHavYZQ";

async function testModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    const modelsToTest = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.0-pro",
        "models/gemini-pro",
        "models/gemini-1.5-pro",
        "models/gemini-1.5-flash"
    ];

    console.log("🔍 Testando modelos disponíveis...\n");

    for (const modelName of modelsToTest) {
        try {
            console.log(`Tentando: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Olá");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ ${modelName} - FUNCIONA! Resposta: ${text.substring(0, 50)}...\n`);
        } catch (error) {
            console.log(`❌ ${modelName} - ERRO: ${error.message}\n`);
        }
    }
}

testModels().catch(console.error);
