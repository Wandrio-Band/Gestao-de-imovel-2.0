const { GoogleGenAI, Type } = require("@google/genai");

const API_KEY = "AIzaSyB2ZW5L-AjlD5lDXb7Fu1cr16biB2vJhq8";

async function testOldSDK() {
    console.log("🔍 Testando SDK @google/genai...\n");

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Diga apenas OK',
            config: {}
        });

        console.log("✅ FUNCIONA!");
        console.log("Resposta:", response.text);
    } catch (error) {
        console.log("❌ Erro:", error.message);
    }
}

testOldSDK();
