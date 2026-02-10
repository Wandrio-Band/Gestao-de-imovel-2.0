"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"

export default function FinancingPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-[#0d121b] dark:text-white transition-colors duration-200">
            <div className="layout-container flex h-full grow flex-col w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black leading-tight tracking-tight text-[#0d121b] dark:text-white">Gestão de Financiamentos</h1>
                        <div className="flex items-center gap-2 text-[#4c669a] dark:text-gray-400">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">EM ANDAMENTO</span>
                            <span className="text-base font-normal">Fluxo Contratual Aprimorado • Edifício Horizon View #402</span>
                        </div>
                    </div>
                    <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white border border-[#cfd7e7] hover:bg-gray-50 text-[#0d121b] text-sm font-bold shadow-sm transition-colors dark:bg-[#232e42] dark:border-[#374151] dark:text-white dark:hover:bg-[#2d3b55]">
                        <span className="material-symbols-outlined mr-2 text-lg">picture_as_pdf</span> Relatório Executivo
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Card 1 */}
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf3] bg-surface-light shadow-sm dark:bg-surface-dark dark:border-[#2a3447]">
                        <div className="flex items-center justify-between">
                            <p className="text-[#4c669a] text-xs font-bold uppercase tracking-wider dark:text-gray-400">Valor Total Imóvel</p>
                            <span className="material-symbols-outlined text-[#cfd7e7] text-xl">real_estate_agent</span>
                        </div>
                        <p className="text-[#0d121b] dark:text-white text-2xl font-bold mt-1">R$ 2.500.000,00</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                    </div>
                    {/* Card 2 */}
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf3] bg-surface-light shadow-sm dark:bg-surface-dark dark:border-[#2a3447]">
                        <div className="flex items-center justify-between">
                            <p className="text-[#4c669a] text-xs font-bold uppercase tracking-wider dark:text-gray-400">Total Quitado (Obra)</p>
                            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        </div>
                        <p className="text-[#0d121b] dark:text-white text-2xl font-bold mt-1">R$ 500.000,00</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "20%" }}></div>
                        </div>
                    </div>
                    {/* Card 3 */}
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf3] bg-surface-light shadow-sm dark:bg-surface-dark dark:border-[#2a3447]">
                        <div className="flex items-center justify-between">
                            <p className="text-[#4c669a] text-xs font-bold uppercase tracking-wider dark:text-gray-400">Saldo Devedor (Const.)</p>
                            <span className="material-symbols-outlined text-orange-400 text-xl">construction</span>
                        </div>
                        <p className="text-[#0d121b] dark:text-white text-2xl font-bold mt-1">R$ 200.000,00</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                            <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: "8%" }}></div>
                        </div>
                    </div>
                    {/* Card 4 */}
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#e7ebf3] bg-surface-light shadow-sm dark:bg-surface-dark dark:border-[#2a3447]">
                        <div className="flex items-center justify-between">
                            <p className="text-[#4c669a] text-xs font-bold uppercase tracking-wider dark:text-gray-400">A Financiar (Banco)</p>
                            <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                        </div>
                        <p className="text-[#0d121b] dark:text-white text-2xl font-bold mt-1">R$ 1.800.000,00</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: "72%" }}></div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto no-scrollbar">
                    <nav aria-label="Tabs" className="-mb-px flex space-x-8">
                        <a href="#" className="border-primary text-primary whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold dark:text-blue-400 dark:border-blue-400">
                            Modo Edição (Fases)
                        </a>
                        <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium dark:text-gray-400 dark:hover:text-gray-300">
                            Cronograma Projetado (Desembolso Anual)
                        </a>
                    </nav>
                </div>

                {/* Tab Content: Edition Mode */}
                <div className="block">
                    {/* Fase 1 */}
                    <div className="flex flex-col rounded-xl border border-[#cfd7e7] bg-surface-light shadow-sm overflow-hidden mb-6 dark:bg-surface-dark dark:border-[#2a3447]">
                        <div className="p-4 border-b border-[#e7ebf3] flex items-center justify-between bg-gray-50/50 dark:bg-[#1f2937] dark:border-[#2a3447]">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-primary dark:bg-blue-900/30">
                                    <span className="material-symbols-outlined">engineering</span>
                                </div>
                                <div>
                                    <h3 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Fase 1: Construtora & Aporte Inicial</h3>
                                    <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal">Gerenciamento de fluxo de obra e entrada parcelada.</p>
                                </div>
                            </div>
                            <label className="relative flex items-center cursor-pointer gap-3">
                                <span className="text-sm font-medium text-[#0d121b] dark:text-white hidden sm:block">Ativar Fase Construtora</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </label>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4c669a] dark:text-gray-400 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">calendar_view_week</span>
                                            Blocos de Pagamento
                                        </h4>
                                        <button className="text-xs font-medium text-primary hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 dark:bg-blue-900/20 dark:text-blue-300">
                                            <span className="material-symbols-outlined text-base">add_circle</span> Adicionar Grupo
                                        </button>
                                    </div>
                                    {/* Payment Block 1 */}
                                    <div className="group relative rounded-xl border border-[#e7ebf3] bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-[#1a2233] dark:border-[#2a3447]">
                                        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        <span className="material-symbols-outlined text-lg">payments</span>
                                                    </div>
                                                    <h5 className="text-base font-bold text-[#0d121b] dark:text-white">Entrada (Sinal)</h5>
                                                </div>
                                                <div className="pl-10">
                                                    <p className="text-xs text-[#4c669a] dark:text-gray-400 mb-1">Vencimento: <span className="font-medium text-[#0d121b] dark:text-white">10/01/2023</span></p>
                                                    <p className="text-xs text-[#4c669a] dark:text-gray-400">Parcela Única</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-right pl-10 sm:pl-0">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[#4c669a] dark:text-gray-500">Valor Total</span>
                                                <span className="text-xl font-bold text-[#0d121b] dark:text-white">R$ 200.000,00</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-600">Sem correção INCC</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Payment Block 2 */}
                                    <div className="group relative rounded-xl border border-[#e7ebf3] bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-[#1a2233] dark:border-[#2a3447]">
                                        <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-lg">edit</span></button>
                                            <button className="text-gray-400 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div>
                                                <div className="mb-1 flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-300">
                                                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                                                    </div>
                                                    <h5 className="text-base font-bold text-[#0d121b] dark:text-white">Mensais</h5>
                                                    <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">24x Parcelas</span>
                                                </div>
                                                <div className="pl-10">
                                                    <p className="text-xs text-[#4c669a] dark:text-gray-400 mb-1">Início: <span className="font-medium text-[#0d121b] dark:text-white">10/02/2023</span></p>
                                                    <p className="text-xs text-[#4c669a] dark:text-gray-400">Valor Unitário: <span className="font-medium text-[#0d121b] dark:text-white">R$ 5.000,00</span></p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-right pl-10 sm:pl-0">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-[#4c669a] dark:text-gray-500">Subtotal Grupo</span>
                                                <span className="text-xl font-bold text-[#0d121b] dark:text-white">R$ 120.000,00</span>
                                                <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded dark:bg-orange-900/20">
                                                    <span className="material-symbols-outlined text-[10px]">trending_up</span>
                                                    <span>+ R$ 42,00 (INCC est.)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Footer */}
                                    <div className="rounded-lg bg-gray-50 p-4 border border-dashed border-[#cfd7e7] dark:bg-[#1f2937] dark:border-[#374151] flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <span className="text-xs font-bold uppercase text-[#4c669a] dark:text-gray-400">Total Acumulado Fase 1</span>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-[#4c669a] dark:text-gray-500">Original</p>
                                                <p className="text-lg font-bold text-[#0d121b] dark:text-white">R$ 520.000,00</p>
                                            </div>
                                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-[#4c669a] dark:text-gray-500">Corrigido (Est.)</p>
                                                <p className="text-lg font-bold text-primary dark:text-blue-400">R$ 521.292,00</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-1 h-full">
                                    <div className="sticky top-24 h-full flex flex-col">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-[#4c669a] dark:text-gray-400 mb-5 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">tune</span>
                                            Parâmetros
                                        </h4>
                                        <div className="flex-1 flex flex-col gap-5 p-5 rounded-xl border border-[#e7ebf3] bg-surface-light shadow-sm dark:bg-surface-dark dark:border-[#2a3447]">
                                            <div>
                                                <label className="block text-xs font-bold text-[#4c669a] mb-2 dark:text-gray-400 uppercase tracking-wide">Índice de Correção</label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">show_chart</span>
                                                    <select className="w-full pl-10 rounded-lg border-[#cfd7e7] bg-gray-50 text-sm font-medium text-[#0d121b] focus:border-primary focus:ring-primary dark:bg-[#232e42] dark:border-[#4b5563] dark:text-white transition-shadow py-2.5">
                                                        <option>INCC-M (FGV)</option>
                                                        <option>IGP-M</option>
                                                        <option>CUB</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="flex justify-between items-center p-3 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
                                                    <span className="text-xs font-medium text-orange-800 dark:text-orange-300">Projeção Acumulada</span>
                                                    <span className="text-sm font-black text-orange-600 dark:text-orange-400">4.52%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-[#4c669a] dark:text-gray-400">Impacto Financeiro Total:</span>
                                                    <span className="text-sm font-bold text-[#0d121b] dark:text-white">R$ ~32.400</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Handover */}
                    <div className="relative flex items-center justify-center py-6 mb-6">
                        <div aria-hidden="true" className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-dashed border-gray-300 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex items-center justify-center bg-white dark:bg-[#232e42] border border-blue-100 dark:border-blue-900 px-6 py-2 rounded-full shadow-sm z-10">
                            <span className="material-symbols-outlined text-primary mr-2">key</span>
                            <span className="text-sm font-bold text-primary tracking-wide">ENTREGA DE CHAVES</span>
                            <span className="material-symbols-outlined text-primary ml-2">arrow_forward</span>
                        </div>
                    </div>

                    {/* Fase 2 */}
                    <div className="flex flex-col rounded-xl border border-[#cfd7e7] bg-surface-light shadow-sm overflow-hidden mb-8 dark:bg-surface-dark dark:border-[#2a3447]">
                        <div className="p-4 border-b border-[#e7ebf3] bg-gray-50/50 flex items-center gap-3 dark:bg-[#1f2937] dark:border-[#2a3447]">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                <span className="material-symbols-outlined">account_balance</span>
                            </div>
                            <div>
                                <h3 className="text-[#0d121b] dark:text-white text-base font-bold leading-tight">Fase 2: Bancária - FINANCIAMENTO PÓS-CHAVES</h3>
                                <p className="text-[#4c669a] dark:text-gray-400 text-sm font-normal">Simulação e controle do saldo devedor bancário.</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-[#4c669a] uppercase dark:text-gray-400">Sistema de Amortização</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">calculate</span>
                                            <select className="w-full pl-10 rounded-md border-[#cfd7e7] bg-white text-sm font-medium text-[#0d121b] h-10 focus:border-primary focus:ring-primary dark:bg-[#232e42] dark:border-[#4b5563] dark:text-white">
                                                <option>SAC (Decrescente)</option>
                                                <option>PRICE (Fixa)</option>
                                                <option>SACRE</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-[#4c669a] uppercase dark:text-gray-400">Prazo Total</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">calendar_month</span>
                                            <input className="w-full pl-10 rounded-md border-[#cfd7e7] bg-white text-sm font-medium text-[#0d121b] h-10 focus:border-primary focus:ring-primary dark:bg-[#232e42] dark:border-[#4b5563] dark:text-white" type="number" defaultValue="360" />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">meses</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-[#4c669a] uppercase dark:text-gray-400">Taxa de Juros (Anual)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 material-symbols-outlined text-[20px]">percent</span>
                                            <input className="w-full pl-10 rounded-md border-[#cfd7e7] bg-white text-sm font-medium text-[#0d121b] h-10 focus:border-primary focus:ring-primary dark:bg-[#232e42] dark:border-[#4b5563] dark:text-white" type="text" defaultValue="9.8" />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">% a.a.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full lg:w-1/3 flex items-end">
                                    <button className="w-full flex items-center justify-center rounded-lg h-10 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm gap-2">
                                        <span className="material-symbols-outlined text-lg">sync_alt</span> Calcular Simulação
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-wrap items-center justify-between gap-4 dark:bg-indigo-900/20 dark:border-indigo-800">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-white flex items-center justify-center text-indigo-600 shadow-sm dark:bg-[#1f2937] dark:text-indigo-400">
                                        <span className="material-symbols-outlined">payments</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-indigo-800 dark:text-indigo-300 font-bold uppercase">Primeira Parcela (Estimada)</p>
                                        <p className="text-xl font-black text-[#0d121b] dark:text-white">R$ 18.450,22</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8 text-sm">
                                    <div>
                                        <p className="text-xs text-[#4c669a] dark:text-gray-400">Última Parcela</p>
                                        <p className="font-bold text-[#0d121b] dark:text-white">R$ 5.200,45</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#4c669a] dark:text-gray-400">CET Anual</p>
                                        <p className="font-bold text-[#0d121b] dark:text-white">10.45%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cash Flow Table */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[#0d121b] dark:text-white tracking-tight text-xl font-bold leading-tight">Fluxo de Caixa Unificado</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-9 text-xs font-bold gap-1"><span className="material-symbols-outlined text-base">edit</span> Editar Lançamento</Button>
                                <Button variant="outline" size="sm" className="h-9 text-xs font-bold gap-1"><span className="material-symbols-outlined text-base mr-1">filter_list</span> Filtrar</Button>
                                <Button className="h-9 px-3 bg-primary text-white hover:bg-blue-700 text-xs font-bold transition-colors"><span className="material-symbols-outlined text-base mr-1">add</span> Adicionar Lançamento</Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#cfd7e7] bg-surface-light overflow-hidden shadow-sm dark:bg-surface-dark dark:border-[#2a3447]">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-[#4c669a] font-medium border-b border-[#e7ebf3] dark:bg-[#1f2937] dark:text-gray-400 dark:border-[#374151]">
                                        <tr>
                                            <th className="px-5 py-3 w-[120px]">Vencimento</th>
                                            <th className="px-5 py-3 w-[100px]">Fase</th>
                                            <th className="px-5 py-3">Descrição</th>
                                            <th className="px-5 py-3 text-right">Correção/Juros</th>
                                            <th className="px-3 py-3 text-right text-xs uppercase font-bold w-[120px]">Val. Final</th>
                                            <th className="px-5 py-3 text-center w-[120px]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e7ebf3] bg-white dark:bg-[#232e42] dark:divide-[#374151]">
                                        <tr className="hover:bg-gray-50 dark:hover:bg-[#2d3b55] transition-colors group">
                                            <td className="px-5 py-3 font-medium text-[#0d121b] dark:text-white">10/01/2023</td>
                                            <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Fase 1</span></td>
                                            <td className="px-5 py-3 text-[#0d121b] dark:text-white">Entrada - Parcela Única</td>
                                            <td className="px-5 py-3 text-right text-gray-400">-</td>
                                            <td className="px-3 py-3 text-right font-medium text-[#0d121b] dark:text-white">R$ 50.000,00</td>
                                            <td className="px-5 py-3 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Pago</span></td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-[#2d3b55] transition-colors group">
                                            <td className="px-5 py-3 font-medium text-[#0d121b] dark:text-white">10/02/2023</td>
                                            <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Fase 1</span></td>
                                            <td className="px-5 py-3 text-[#0d121b] dark:text-white">Mensal 01/24</td>
                                            <td className="px-5 py-3 text-right text-orange-500 text-xs">+ R$ 42,00 (INCC)</td>
                                            <td className="px-3 py-3 text-right font-medium text-[#0d121b] dark:text-white">R$ 5.042,00</td>
                                            <td className="px-5 py-3 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Pago</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
