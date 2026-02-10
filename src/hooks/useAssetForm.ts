import { useState, useEffect } from 'react';
import { Asset, PartnerShare, FinancingDetails, LeaseDetails } from '../components/ai-studio/types';

export const useAssetForm = (initialAsset?: Asset) => {
    // Core Identifiers
    const [name, setName] = useState('');
    const [type, setType] = useState<Asset['type']>('Residencial');
    const [status, setStatus] = useState<Asset['status']>('Vago');

    // Address Details
    const [zipCode, setZipCode] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [complement, setComplement] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [description, setDescription] = useState('');

    // Documentation
    const [areaTotal, setAreaTotal] = useState('');
    const [matricula, setMatricula] = useState('');
    const [iptu, setIptu] = useState('');
    const [condominio, setCondominio] = useState('');
    const [registryOffice, setRegistryOffice] = useState('');
    const [acquisitionDate, setAcquisitionDate] = useState('');
    const [irpfStatus, setIrpfStatus] = useState<Asset['irpfStatus']>('Declarado');
    const [acquisitionOrigin, setAcquisitionOrigin] = useState('');

    // Financials
    const [marketValue, setMarketValue] = useState('');
    const [rentalValue, setRentalValue] = useState(''); // Suggested
    const [acquisitionValue, setAcquisitionValue] = useState('');
    const [declaredValue, setDeclaredValue] = useState('');
    const [saleForecast, setSaleForecast] = useState('');

    // Complex Objects
    const [partners, setPartners] = useState<PartnerShare[]>([]);
    const [financingData, setFinancingData] = useState<FinancingDetails | null>(null);
    const [leaseData, setLeaseData] = useState<LeaseDetails | null>(null);

    // UI Toggles
    const [enableFinancial, setEnableFinancial] = useState(false);
    const [enableLease, setEnableLease] = useState(false);
    const [enableSaleForecast, setEnableSaleForecast] = useState(false);

    // Load initial data
    useEffect(() => {
        if (initialAsset) {
            setName(initialAsset.name);
            setType(initialAsset.type);
            setStatus(initialAsset.status);

            // Parse address
            // Assuming address string parsing logic if needed, or simple mapping if fields exist
            // For now, implementing simple mapping if individual fields were stored, 
            // otherwise relying on user to re-enter split address or implementing a parser later.
            // The previous component code didn't explicitly parse 'initialAsset.address' back into fields 
            // unless they were stored separately. The props interface matches Asset.

            setZipCode(initialAsset.zipCode || '');
            setStreet(initialAsset.street || '');
            setNumber(initialAsset.number || '');
            setComplement(initialAsset.complement || '');
            setNeighborhood(initialAsset.neighborhood || '');
            setCity(initialAsset.city || '');
            setState(initialAsset.state || '');
            setDescription(initialAsset.description || '');

            setAreaTotal(initialAsset.areaTotal?.toString() || '');
            setMatricula(initialAsset.matricula || '');
            setIptu(initialAsset.iptu || '');
            setCondominio(initialAsset.condominio || '');
            setRegistryOffice(initialAsset.registryOffice || '');
            setAcquisitionDate(initialAsset.acquisitionDate || '');
            setIrpfStatus(initialAsset.irpfStatus || 'Declarado');
            setAcquisitionOrigin(initialAsset.acquisitionOrigin || '');

            setMarketValue(initialAsset.marketValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setRentalValue(initialAsset.suggestedRentalValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setAcquisitionValue(initialAsset.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setDeclaredValue(initialAsset.declaredValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '');
            setSaleForecast(initialAsset.saleForecast || '');

            setPartners(initialAsset.partners || []);
            setFinancingData(initialAsset.financingDetails || null);
            setLeaseData(initialAsset.leaseDetails || null);
            setEnableFinancial(!!initialAsset.financingDetails);
            setEnableLease(!!initialAsset.leaseDetails);
            setEnableSaleForecast(!!initialAsset.saleForecast);
        } else {
            // Reset logic for new asset?
            // Usually form unmounts, but if reused:
            setName('');
            setType('Residencial');
            setStatus('Vago');
            // ... reset others if needed
        }
    }, [initialAsset]);

    // Helpers
    const parseCurrency = (val: string) => {
        if (!val) return 0;
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
    }

    const handleCurrencyInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cleanValue = value.replace(/\D/g, '');
        const numberValue = Number(cleanValue) / 100;
        setter(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    };

    const getFormattedAsset = (): Asset => {
        const fullAddress = street ? `${street}, ${number} - ${neighborhood}` : initialAsset?.address || '';

        // Rental logic
        let currentRentalValue = initialAsset?.rentalValue || 0;
        if (leaseData && leaseData.valorAluguel) {
            currentRentalValue = parseCurrency(leaseData.valorAluguel);
        }

        return {
            id: initialAsset?.id || Date.now().toString(),
            name,
            type,
            status,

            address: fullAddress,
            zipCode,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            description,

            areaTotal: parseFloat(areaTotal) || 0,
            matricula,
            iptu,
            condominio,
            registryOffice,
            acquisitionDate,
            irpfStatus,
            acquisitionOrigin,

            partners,
            value: parseCurrency(acquisitionValue),
            marketValue: parseCurrency(marketValue),
            declaredValue: parseCurrency(declaredValue),
            saleForecast,
            suggestedRentalValue: parseCurrency(rentalValue),

            rentalValue: currentRentalValue,
            image: initialAsset?.image || '',
            financingDetails: financingData || undefined,
            leaseDetails: leaseData || undefined
        };
    };

    return {
        formState: {
            name, setName,
            type, setType,
            status, setStatus,
            zipCode, setZipCode,
            street, setStreet,
            number, setNumber,
            complement, setComplement,
            neighborhood, setNeighborhood,
            city, setCity,
            state, setState,
            description, setDescription,
            areaTotal, setAreaTotal,
            matricula, setMatricula,
            iptu, setIptu,
            condominio, setCondominio,
            registryOffice, setRegistryOffice,
            acquisitionDate, setAcquisitionDate,
            irpfStatus, setIrpfStatus,
            acquisitionOrigin, setAcquisitionOrigin,
            marketValue, setMarketValue,
            rentalValue, setRentalValue,
            acquisitionValue, setAcquisitionValue,
            declaredValue, setDeclaredValue,
            saleForecast, setSaleForecast,
            partners, setPartners,
            financingData, setFinancingData,
            leaseData, setLeaseData,
            enableFinancial, setEnableFinancial,
            enableLease, setEnableLease,
            enableSaleForecast, setEnableSaleForecast
        },
        helpers: {
            handleCurrencyInput,
            getFormattedAsset
        }
    };
};
