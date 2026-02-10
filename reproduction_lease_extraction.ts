
const testRegex = () => {
    const fullText = `
    CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL
    
    LOCADOR: JOÃO DA SILVA
    
    LOCATÁRIO: EDUARDO PEREIRA DA COSTA
    Brasileiro, solteiro, portador do CPF 123.456.789-00.
    
    CLÁUSULA PRIMEIRA - O valor do aluguel mensal é de R$ 2.500,00 (dois mil e quinhentos reais).
    
    CLÁUSULA SEGUNDA - O pagamento deverá ser efetuado até o dia 10 de cada mês.
    
    CLÁUSULA TERCEIRA - O prazo de locação é de 30 meses, iniciando-se em 01/02/2024 e terminando em 01/08/2026.
    
    CLÁUSULA QUARTA - O locatário não terá direito a qualquer indenização ou retenção do imóvel por quaisquer benfeitorias.
    
    Brasília, 20 de Janeiro de 2024.
    `;

    console.log("--- START TEST ---");

    // 1. Nome Regex Logic from LeaseModal
    const nomeMatch = fullText.match(/(?:Locat[áa]rio|Inquilino|Nome)[:.\s]*([A-ZÀ-Ú][a-zà-úA-ZÀ-Ú\s]+?)(?:\n|CPF|CNPJ|,)/i);
    console.log("Nome Match:", nomeMatch ? nomeMatch[1].trim() : "NULL");

    // 2. Valor Regex Logic from LeaseModal
    const valorMatch = fullText.match(/(?:valor|aluguel|loca[çc][ãa]o)[:.\s]*R?\$?\s*([\d.,]+)/i);
    if (valorMatch) {
        console.log("Raw Valor Match:", valorMatch[1]);
        const valorStr = valorMatch[1].replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorStr);
        console.log("Parsed Valor:", valor);
    } else {
        console.log("Valor Match: NULL");
    }

    // 3. Bad Case Simulation (Text that likely caused the error)
    const badText = `
    LOCATÁRIO:
    EDUARDO PEREIRA
    
    Parágrafo único: O locatário não terá direito a qualquer indenização...
    `;
    // The regex expects the name immediately after the colon?
    const badNameMatch = badText.match(/(?:Locat[áa]rio|Inquilino|Nome)[:.\s]*([A-ZÀ-Ú][a-zà-úA-ZÀ-Ú\s]+?)(?:\n|CPF|CNPJ|,)/i);
    console.log("Bad Name Match:", badNameMatch ? badNameMatch[1].trim() : "NULL");

    console.log("--- END TEST ---");
};

testRegex();
