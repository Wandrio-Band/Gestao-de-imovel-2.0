import { IRPFExtractedAsset } from '../types';

// IRPF Parser v2 - Multi-Strategy
// Handles various PDF text extraction formats

export function parseIRPFProperties(text: string): IRPFExtractedAsset[] {
    const properties: IRPFExtractedAsset[] = [];

    // Strategy 1: Find property entries by keywords and values
    // Look for lines containing property indicators + monetary values

    const lines = text.split('\n');
    let currentProperty: Partial<IRPFExtractedAsset> | null = null;
    let collectingDetails = false;
    let detailsBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Detect start of property block
        // Look for: "01" (grupo) + property type keywords
        const isPropertyStart = (
            /\b0*1\b/.test(line) && // Grupo 01
            /apartamento|casa|terreno|sala|comercial|residencial|lote|edif[íi]cio/i.test(line)
        ) || line.match(/^(148|149|150|151|152|153|154|155)\s+0*1\s+\d+/); // BEM + GRUPO + CÓDIGO

        if (isPropertyStart || collectingDetails) {
            if (!currentProperty) {
                currentProperty = {
                    id_declaracao: '',
                    descricao: '',
                    descricao_resumida: '',
                    valor_ir_atual: 0,
                    matricula: '',
                    iptu: '',
                    municipio: '',
                    uf: '',
                    cep: '',
                    area_total: 0,
                    cartorio: ''
                };
                collectingDetails = true;
                detailsBuffer = [];
            }

            detailsBuffer.push(line);

            // Extract CÓDIGO
            const codigoMatch = line.match(/\b0*1\s+(\d+)/);
            if (codigoMatch && !currentProperty.id_declaracao) {
                currentProperty.id_declaracao = codigoMatch[1];
            }

            // Extract description parts
            if (/apartamento|casa|terreno|comercial/i.test(line)) {
                currentProperty.descricao += ' ' + line;
            }

            // Extract value (R$ format)
            const valorMatch = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/g);
            if (valorMatch && valorMatch.length > 0) {
                // Take the last value found (usually the most recent year)
                const valorStr = valorMatch[valorMatch.length - 1];
                const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
                if (currentProperty.valor_ir_atual !== undefined && valor > currentProperty.valor_ir_atual) {
                    currentProperty.valor_ir_atual = valor;
                }
            }

            // Extract município/cidade
            if (line.includes('Município:') || line.includes('MUNICÍPIO:')) {
                const municipioMatch = line.match(/Munic[íi]pio:\s*(.+?)(?:\s+UF:|$)/i);
                if (municipioMatch) {
                    currentProperty.municipio = municipioMatch[1].trim();
                }
            }

            // Extract from patterns like "PORTO VELHO" or "COARI"
            const cidadeMatch = line.match(/\b([A-ZÀ-Ú][A-ZÀ-Ú\s]{3,})\b/);
            if (cidadeMatch && !currentProperty.municipio) {
                const possibleCidade = cidadeMatch[1].trim();
                if (possibleCidade.length > 3 && possibleCidade.length < 30) {
                    currentProperty.municipio = possibleCidade;
                }
            }

            // Extract UF
            const ufMatch = line.match(/\b([A-Z]{2})\b/);
            if (ufMatch && !currentProperty.uf) {
                currentProperty.uf = ufMatch[1];
            }

            // Extract IPTU
            if (line.includes('IPTU') || line.includes('Inscrição Municipal')) {
                const iptuMatch = line.match(/(\d[\d.\-\/]+)/);
                if (iptuMatch) {
                    currentProperty.iptu = iptuMatch[1];
                }
            }

            // Extract Área
            const areaMatch = line.match(/([\d.,]+)\s*m[²2]/i);
            if (areaMatch) {
                currentProperty.area_total = parseFloat(areaMatch[1].replace(',', '.'));
            }

            // Extract CEP
            const cepMatch = line.match(/\b(\d{5}-?\d{3})\b/);
            if (cepMatch) {
                currentProperty.cep = cepMatch[1];
            }

            // Extract Matrícula
            if (line.includes('Matrícula:')) {
                const matMatch = line.match(/Matrícula:\s*(\S+)/);
                if (matMatch) {
                    currentProperty.matricula = matMatch[1];
                }
            }

            // Detect end of property block
            // If we find another property start or empty section
            const nextIsProperty = i < lines.length - 1 &&
                (/^(148|149|150|151|152|153|154|155)\s+0*1/.test(lines[i + 1]) ||
                    lines[i + 1].includes('Grupo:'));

            if (nextIsProperty || i === lines.length - 1) {
                // Finish current property
                if (currentProperty.valor_ir_atual !== undefined && currentProperty.valor_ir_atual > 0) {
                    // Clean up description
                    currentProperty.descricao = currentProperty.descricao?.trim() || '';

                    // Create summary
                    const desc = (currentProperty.descricao || '').toLowerCase();
                    const tipo = /apartamento|apto/i.test(desc) ? 'Apto' :
                        /casa/i.test(desc) ? 'Casa' :
                            /terreno/i.test(desc) ? 'Terreno' :
                                /comercial|sala/i.test(desc) ? 'Comercial' : 'Imóvel';

                    // Extract number from description
                    const numeroMatch = (currentProperty.descricao || '').match(/\b(\d{3,5})\b/);
                    const numero = numeroMatch ? numeroMatch[1] : currentProperty.id_declaracao;

                    currentProperty.descricao_resumida =
                        `${tipo} ${numero} - ${currentProperty.municipio || 'Ver descrição'}`;

                    properties.push(currentProperty as IRPFExtractedAsset);
                }

                // Reset for next property
                currentProperty = null;
                collectingDetails = false;
                detailsBuffer = [];
            }
        }
    }

    return properties;
}
