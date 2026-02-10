const { GoogleGenAI } = require("@google/genai");

const API_KEY = "AIzaSyB2ZW5L-AjlD5lDXb7Fu1cr16biB2vJhq8";

async function testModelsSDK() {
    console.log("🔍 Testando modelos com @google/genai...\n");

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const modelsToTest = [
        'gemini-3-flash-preview',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-flash'
    ];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testando: ${modelName}...`);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: 'Diga apenas OK'
            });
            console.log(`✅ ${modelName} - FUNCIONA!`);
            console.log(`Resposta: ${response.text}\n`);
        } catch (error) {
            console.log(`❌ ${modelName} - ERRO: ${error.message}\n`);
        }
    }
}

testModelsSDK();
