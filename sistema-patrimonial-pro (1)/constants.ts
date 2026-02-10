import { Asset } from './types';

// Helper to get consistent colors for specific partners
const getPartnerStyle = (name: string) => {
  switch (name) {
    case 'Wândrio': return { initials: 'W', color: 'bg-orange-100 text-orange-700' };
    case 'Raquel': return { initials: 'R', color: 'bg-purple-100 text-purple-700' };
    case 'Marília': return { initials: 'M', color: 'bg-pink-100 text-pink-700' };
    case 'Tilinha': return { initials: 'T', color: 'bg-blue-100 text-blue-700' };
    default: return { initials: name.charAt(0), color: 'bg-gray-100 text-gray-700' };
  }
};

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'HORIZON-402',
    name: 'Edifício Horizon View #402',
    type: 'Residencial',
    address: 'Av. do Contorno, 5800',
    zipCode: '30110-038',
    street: 'Av. do Contorno',
    number: '5800',
    complement: 'Apto 402',
    neighborhood: 'Savassi',
    city: 'Belo Horizonte',
    state: 'MG',
    areaPrivative: 145,
    areaTotal: 180,
    bedrooms: 4,
    suites: 2,
    bathrooms: 4,
    parkingSpaces: 3,
    matricula: '88.123-2',
    iptu: '5502.112.002-1',
    value: 2500000,
    marketValue: 2850000,
    rentalValue: 0,
    status: 'Em Reforma',
    acquisitionDate: '2023-01-10',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop',
    partners: [
      { ...getPartnerStyle('Raquel'), name: 'Raquel', percentage: 50 },
      { ...getPartnerStyle('Marília'), name: 'Marília', percentage: 50 }
    ],
    financingDetails: {
        valorTotal: '2.500.000,00',
        subtotalConstrutora: 520000, // Sinal + Mensais + Baloes
        valorFinanciar: '1.800.000,00',
        valorQuitado: 500000,
        saldoDevedor: 20000,
        dataAssinatura: '2023-01-10',
        vencimentoConstrutora: '2023-02-10',
        vencimentoPrimeira: '2025-01-10', // Pós Chaves
        prazoMeses: '360',
        jurosAnuais: '9.8',
        indexador: 'IPCA',
        sistemaAmortizacao: 'SAC',
        taxaAdm: '25,00',
        seguros: '0,05',
        phases: {
            sinal: { qtd: 1, unitario: 200000 },
            mensais: { qtd: 24, unitario: 5000 },
            baloes: { qtd: 4, unitario: 50000 }
        },
        cashFlow: [
            {
                id: '1',
                vencimento: '10/01/2023',
                fase: 'Fase 1',
                descricao: 'Entrada - Parcela Única',
                correcao: '-',
                valoresPorSocio: { 'Raquel': 100000, 'Marília': 100000 },
                status: 'Pago'
            },
            {
                id: '2',
                vencimento: '10/02/2023',
                fase: 'Fase 1',
                descricao: 'Mensal 01/24',
                correcao: '+ R$ 42,00 (INCC)',
                valoresPorSocio: { 'Raquel': 2521, 'Marília': 2521 },
                status: 'Pago'
            },
            {
                id: '3',
                vencimento: '10/03/2023',
                fase: 'Fase 1',
                descricao: 'Mensal 02/24',
                correcao: '+ R$ 85,00 (INCC)',
                valoresPorSocio: { 'Raquel': 2542.50, 'Marília': 2542.50 },
                status: 'Pago'
            },
            {
                id: '4',
                vencimento: '10/06/2023',
                fase: 'Fase 1',
                descricao: 'Balão Semestral 01/04',
                correcao: '+ R$ 1.250,00 (INCC)',
                valoresPorSocio: { 'Raquel': 25625, 'Marília': 25625 },
                status: 'Pendente'
            },
             {
                id: '5',
                vencimento: '10/01/2025',
                fase: 'Fase 2',
                descricao: 'Financiamento - Parcela 001',
                correcao: '+ Juros 9.8% a.a.',
                valoresPorSocio: { 'Raquel': 9225.11, 'Marília': 9225.11 },
                status: 'Futuro'
            }
        ]
    }
  },
  {
    id: '15',
    name: '03 LOTES - RUA AUGUSTO DE QUEIROZ - CAIÇARAS',
    type: 'Terreno',
    address: 'Rua Augusto de Queiroz',
    zipCode: '30775-260',
    street: 'Rua Augusto de Queiroz',
    number: 'Lotes 10-12',
    complement: '',
    neighborhood: 'Caiçaras',
    city: 'Belo Horizonte',
    state: 'MG',
    areaTotal: 1080,
    areaPrivative: 1080,
    value: 450000,
    marketValue: 450000,
    rentalValue: 0,
    status: 'Vago',
    acquisitionDate: '2015-06-20',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop',
    partners: [
      { ...getPartnerStyle('Tilinha'), name: 'Tilinha', percentage: 100 }
    ],
    financingDetails: null // No financing
  },
  {
    id: '20',
    name: '50% APTO Nº 102 – ED. NATÉRCIA',
    type: 'Residencial',
    address: 'Rua da Bahia, 102',
    zipCode: '30160-010',
    street: 'Rua da Bahia',
    number: '102',
    complement: 'Apto 102',
    neighborhood: 'Centro',
    city: 'Belo Horizonte',
    state: 'MG',
    areaPrivative: 95,
    areaTotal: 110,
    bedrooms: 3,
    suites: 1,
    bathrooms: 2,
    parkingSpaces: 1,
    value: 600000,
    marketValue: 850000,
    rentalValue: 2500,
    status: 'Locado',
    acquisitionDate: '2018-03-15',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1000&auto=format&fit=crop',
    partners: [
      { ...getPartnerStyle('Tilinha'), name: 'Tilinha', percentage: 50 },
      { ...getPartnerStyle('Wândrio'), name: 'Wândrio', percentage: 50 }
    ],
    financingDetails: null
  },
  {
    id: 'SP04',
    name: 'SALA COMERCIAL FARIA LIMA',
    type: 'Comercial',
    address: 'Av. Faria Lima',
    zipCode: '01452-001',
    street: 'Av. Brigadeiro Faria Lima',
    number: '3064',
    complement: 'Sala 901',
    neighborhood: 'Jardim Paulistano',
    city: 'São Paulo',
    state: 'SP',
    areaPrivative: 45,
    areaTotal: 62,
    bathrooms: 1,
    parkingSpaces: 1,
    value: 2200000,
    marketValue: 2800000,
    rentalValue: 15000,
    status: 'Locado',
    acquisitionDate: '2021-11-01',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop',
    partners: [
      { ...getPartnerStyle('Raquel'), name: 'Raquel', percentage: 60 },
      { ...getPartnerStyle('Marília'), name: 'Marília', percentage: 40 }
    ],
    financingDetails: {
        valorTotal: '2.200.000,00',
        subtotalConstrutora: 0,
        valorFinanciar: '1.500.000,00',
        valorQuitado: 700000,
        saldoDevedor: 1450000,
        prazoMeses: '120',
        jurosAnuais: '10.5',
        indexador: 'IGP-M',
        sistemaAmortizacao: 'PRICE',
        phases: { sinal: {qtd:0,unitario:0}, mensais: {qtd:0,unitario:0}, baloes: {qtd:0,unitario:0} }
    }
  }
];