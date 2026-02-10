
export interface Asset {
  id: string;
  name: string;
  type: 'Residencial' | 'Comercial' | 'Terreno' | 'Industrial';
  // Address Details
  address: string; // Keep for backward compatibility/display
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  description?: string;

  // Property Characteristics
  areaPrivative?: number;
  areaTotal?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  parkingSpaces?: number;

  // Documentation
  matricula?: string;
  iptu?: string;
  condominio?: string;
  registryOffice?: string; // Cartório
  acquisitionDate?: string;
  irpfStatus?: 'Declarado' | 'Pendente' | 'Isento';
  acquisitionOrigin?: string;

  // Financial Evaluation
  value: number; // Valor de Aquisição
  marketValue: number;
  declaredValue?: number; // Valor Declarado IRPF
  saleForecast?: string; // Previsão de Venda
  suggestedRentalValue?: number;

  rentalValue: number;
  status: 'Locado' | 'Vago' | 'Em Reforma' | 'Uso Próprio';
  image: string;
  partners: PartnerShare[];
  financingDetails?: FinancingDetails;
  leaseDetails?: LeaseDetails;
}

export interface LeaseDetails {
  nomeInquilino: string;
  documentoInquilino: string;
  emailInquilino: string;
  valorAluguel: string;
  diaVencimento: string;
  tipoGarantia: string;
  inicioVigencia: string;
  fimContrato: string;
  indexador: string;
  contractFile?: any; // File object locally, simpler for now
}

export interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  subtext: string;
  colorClass: string;
  type?: 'standard' | 'progress';
}

export interface FinancingDetails {
  valorTotal: string;
  subtotalConstrutora: number;
  valorFinanciar: string;
  valorQuitado?: number;
  saldoDevedor?: number;
  dataAssinatura?: string;
  vencimentoConstrutora?: string;
  vencimentoPrimeira?: string;
  prazoMeses?: string;
  jurosAnuais?: string;
  indexador?: string;
  sistemaAmortizacao?: string;
  taxaAdm?: string;
  seguros?: string;
  phases?: {
    sinal: { qtd: number; unitario: number };
    mensais: { qtd: number; unitario: number };
    baloes: { qtd: number; unitario: number };
  };
  cashFlow?: CashFlowItem[];
}

export interface CashFlowItem {
  id: string;
  vencimento: string;
  fase: string;
  descricao: string;
  correcao?: string;
  valoresPorSocio: { [partnerName: string]: number };
  status: 'Pago' | 'Pendente' | 'Futuro';
}

export interface PartnerShare {
  initials: string;
  name: string;
  percentage: number;
  color: string;
}

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
}

export interface AmortizationResult {
  id?: string; // Unique ID for saved lists
  assetName: string;
  simulationDate: string;
  strategy: 'term' | 'installment';
  extraPayment: number;
  original: {
    balance: number;
    term: number;
    totalPaid: number; // Principal + Interest projected
    totalInterest: number;
    lastPaymentDate: string;
    monthlyPayment: number;
  };
  simulated: {
    balance: number;
    term: number;
    totalPaid: number;
    totalInterest: number;
    lastPaymentDate: string;
    monthlyPayment: number;
  };
  savings: number;
  monthsReduced: number;
}

export interface IRPFExtractedAsset {
  // Identificação no IRPF
  id_declaracao: string;

  // Descrições
  descricao: string;
  descricao_resumida: string;

  // Valores
  valor_ir_atual: number;

  // Documentação
  matricula?: string;
  iptu?: string;
  cartorio?: string;

  //  Endereço Completo
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio: string;
  uf: string;
  cep?: string;

  // Características
  area_total?: number;
  tipo_ativo?: string; // Type of property: Apartamento, Casa, Terreno, etc
  data_aquisicao?: string;
  origem_aquisicao?: string;
}

export interface ReconciliationItem {
  tipo_ativo?: string; // Apartamento, Casa, Terreno, etc
  id: string;
  extracted: IRPFExtractedAsset;
  matchScore: number;
  matchedAssetId?: string;
  status: 'auto_match' | 'suggestion' | 'new';
  action: 'update' | 'create' | 'ignore';
}

export type ViewState =
  | 'dashboard'
  | 'assets_list'
  | 'assets_grid'
  | 'asset_new'
  | 'asset_values'
  | 'financial_overview'
  | 'financing_details'
  | 'financial_schedule'
  | 'debt_management'
  | 'debt_details'
  | 'consolidated_statement'
  | 'amortization_result'
  | 'saved_simulations'
  | 'report_individual'
  | 'report_financial'
  | 'import_irpf'
  | 'audit'
  | 'partners'
  | 'tenants'
  | 'contracts'
  | 'ai_assistant'
  | 'report_executive'
  | 'report_config'
  | 'adjustments'
  | 'conciliation'
  | 'invoices';
