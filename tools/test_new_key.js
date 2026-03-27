const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY || "SUA_CHAVE_AQUI";

async function testNewKey() {
    console.log("🔍 Testando nova API Key...\n");

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Test gemini-pro
    try {
        console.log("Testando gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Diga apenas 'OK'");
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCESSO! Gemini-pro funcionando!`);
        console.log(`Resposta: ${text}\n`);
        return true;
    } catch (error) {
        console.log(`❌ Erro: ${error.message}\n`);
        return false;
    }
}

testNewKey().then(success => {
    if (success) {
        console.log("🎉 API Key válida e funcionando!");
        console.log("✅ Pode usar no sistema agora!");
    } else {
        console.log("❌ API Key não está funcionando");
    }
}).catch(console.error);
