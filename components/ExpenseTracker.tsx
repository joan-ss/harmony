"use client";

import { useState, useEffect } from "react";
import { useFamily } from "@/contexts/FamilyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./ExpenseTracker.module.css";
import { IconMedical, IconSchool, IconClothing, IconWallet, IconShopping, IconPlus, IconCheck } from "./Icons";

interface Expense {
    id: string;
    title: string;
    amount: number;
    payer: "mom" | "dad";
    date: string;
    category: "school" | "medical" | "clothing" | "other" | "fund";
    fundId?: string;
    childId?: string;
    family_id?: string;
}

interface Fund {
    id: string;
    title: string;
    targetAmount?: number;
    currentAmount: number;
    family_id?: string;
}

interface PaymentRequest {
    id: string;
    title: string;
    amount: number;
    type: 'request' | 'send';
    date: string;
    family_id?: string;
}

type Tab = "expenses" | "payments" | "funds" | "predictions";

export default function ExpenseTracker() {
    const { profile, isDemo } = useAuth();
    const { selectedChildId } = useFamily();
    const [activeTab, setActiveTab] = useState<Tab>("expenses");

    // States
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
    const [funds, setFunds] = useState<Fund[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    // Initial Data Load
    useEffect(() => {
        const loadData = async () => {
            if (isDemo) {
                setExpenses([
                    { id: "1", title: "Libros de Texto", amount: 120.50, payer: "dad", date: "2026-02-01", category: "school" },
                    { id: "2", title: "Visita Pediatra", amount: 60.00, payer: "mom", date: "2026-02-05", category: "medical" },
                ]);
                setFunds([
                    { id: "f1", title: "Viaje Fin de Curso", targetAmount: 500, currentAmount: 150 },
                ]);
            } else if (profile?.family_id) {
                const { data: expData } = await supabase.from('expenses').select('*').eq('family_id', profile.family_id);
                const { data: payData } = await supabase.from('payment_requests').select('*').eq('family_id', profile.family_id);
                const { data: fundData } = await supabase.from('funds').select('*').eq('family_id', profile.family_id);

                if (expData) setExpenses(expData);
                if (payData) setPaymentRequests(payData);
                if (fundData) setFunds(fundData);

                // Realtime
                const expSub = supabase.channel('expenses').on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `family_id=eq.${profile.family_id}` }, p => {
                    if (p.eventType === 'INSERT') setExpenses(v => [...v, p.new as Expense]);
                    if (p.eventType === 'DELETE') setExpenses(v => v.filter(e => e.id !== p.old.id));
                }).subscribe();

                const paySub = supabase.channel('requests').on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests', filter: `family_id=eq.${profile.family_id}` }, p => {
                    if (p.eventType === 'INSERT') setPaymentRequests(v => [...v, p.new as PaymentRequest]);
                    if (p.eventType === 'DELETE') setPaymentRequests(v => v.filter(r => r.id !== p.old.id));
                }).subscribe();

                const fundSub = supabase.channel('funds').on('postgres_changes', { event: '*', schema: 'public', table: 'funds', filter: `family_id=eq.${profile.family_id}` }, p => {
                    if (p.eventType === 'INSERT') setFunds(v => [...v, p.new as Fund]);
                    if (p.eventType === 'UPDATE') setFunds(v => v.map(f => f.id === p.new.id ? p.new as Fund : f));
                }).subscribe();

                return () => {
                    expSub.unsubscribe();
                    paySub.unsubscribe();
                    fundSub.unsubscribe();
                }
            }
        };
        loadData();
    }, [isDemo, profile]);

    // Filter expenses based on selected profile
    const filteredExpenses = selectedChildId === 'all'
        ? expenses
        : expenses.filter(e => !e.childId || e.childId === selectedChildId);

    // State for Payment Requests inputs
    const [paymentSubject, setPaymentSubject] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentType, setPaymentType] = useState<"request" | "send">("request");

    // State for New Fund Modal
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [newFundTitle, setNewFundTitle] = useState("");
    const [newFundTarget, setNewFundTarget] = useState("");

    const handleCreateFund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFundTitle || !newFundTarget) return;

        const fundData = {
            title: newFundTitle,
            targetAmount: parseFloat(newFundTarget),
            currentAmount: 0,
            family_id: profile?.family_id
        };

        if (isDemo) {
            setFunds([...funds, { id: Date.now().toString(), ...fundData } as Fund]);
        } else if (profile?.family_id) {
            await supabase.from('funds').insert([fundData]);
        }

        setNewFundTitle("");
        setNewFundTarget("");
        setIsFundModalOpen(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsScanning(true);
            setTimeout(async () => {
                const expenseData = {
                    title: "Compra Supermercado (OCR)",
                    amount: 45.90,
                    payer: profile?.role === 'dad' ? 'dad' : 'mom',
                    date: new Date().toISOString().split('T')[0],
                    category: "other",
                    childId: selectedChildId === 'all' ? undefined : selectedChildId,
                    family_id: profile?.family_id
                };

                if (isDemo) {
                    setExpenses([...expenses, { id: Date.now().toString(), ...expenseData } as Expense]);
                } else if (profile?.family_id) {
                    await supabase.from('expenses').insert([expenseData]);
                }
                setIsScanning(false);
            }, 2000);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount)) return;

        const requestData = {
            title: paymentSubject,
            amount: amount,
            type: paymentType,
            date: new Date().toISOString().split('T')[0],
            family_id: profile?.family_id
        };

        if (isDemo) {
            setPaymentRequests([...paymentRequests, { id: Date.now().toString(), ...requestData } as PaymentRequest]);
        } else if (profile?.family_id) {
            await supabase.from('payment_requests').insert([requestData]);
        }

        setPaymentSubject("");
        setPaymentAmount("");
    };

    const handleAcceptRequest = async (request: PaymentRequest) => {
        const expenseData = {
            title: request.title,
            amount: request.amount,
            payer: profile?.role === 'mom' ? 'mom' : 'dad',
            date: new Date().toISOString().split('T')[0],
            category: "transfer" as any,
            family_id: profile?.family_id
        };

        if (isDemo) {
            setExpenses([{ id: Date.now().toString(), ...expenseData } as Expense, ...expenses]);
            setPaymentRequests(paymentRequests.filter(r => r.id !== request.id));
        } else if (profile?.family_id) {
            await supabase.from('expenses').insert([expenseData]);
            await supabase.from('payment_requests').delete().eq('id', request.id);
        }
    };

    const handleCancelRequest = async (id: string) => {
        if (isDemo) {
            setPaymentRequests(paymentRequests.filter(r => r.id !== id));
        } else if (profile?.family_id) {
            await supabase.from('payment_requests').delete().eq('id', id);
        }
    };

    const totalDad = filteredExpenses.filter(e => e.payer === "dad").reduce((acc, curr) => acc + curr.amount, 0);
    const totalMom = filteredExpenses.filter(e => e.payer === "mom").reduce((acc, curr) => acc + curr.amount, 0);
    const diff = (totalDad - totalMom) / 2;
    const settlementMessage = diff > 0
        ? `Mamá debe pagarle a Papá ${diff.toFixed(2)}€`
        : `Papá debe pagarle a Mamá ${Math.abs(diff).toFixed(2)}€`;

    // AI Prediction Mock Data
    const monthlyAverage = 450;
    const predictedNextMonth = 485;
    const insights = [
        "Gastas un 15% más en 'Escuela' este mes comparado con el promedio.",
        "Se prevé un gasto extra de 50€ en 'Médico' basado en la temporada.",
        "Recomendación: Podrías ahorrar 20€ si compras los libros con antelación."
    ];

    return (
        <>
            <div className={styles.container}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'expenses' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('expenses')}
                    >
                        Gastos
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'payments' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('payments')}
                    >
                        Pagos
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'funds' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('funds')}
                    >
                        Fondos
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'predictions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('predictions')}
                    >
                        Predicciones IA
                    </button>
                </div>

                {activeTab === 'expenses' && (
                    <>
                        <div className={styles.balanceCard}>
                            <h3>Balance Actual {selectedChildId !== 'all' && '(Filtrado)'}</h3>
                            <div className={styles.totals}>
                                <div className={styles.totalItem}>
                                    <span>Papá pagó</span>
                                    <span className={styles.amount}>{totalDad.toFixed(2)}€</span>
                                </div>
                                <div className={styles.divider}></div>
                                <div className={styles.totalItem}>
                                    <span>Mamá pagó</span>
                                    <span className={styles.amount}>{totalMom.toFixed(2)}€</span>
                                </div>
                            </div>
                            <div className={styles.settlement}>
                                {Math.abs(diff) < 0.01 ? "Cuentas saldadas" : settlementMessage}
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <label className={styles.uploadBtn}>
                                {isScanning ? "Procesando..." : "Escanear Tiquet"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    hidden
                                    disabled={isScanning}
                                />
                            </label>
                        </div>

                        <div className={styles.historyHeader}>
                            <h3>Historial de Pagos</h3>
                            <span>{filteredExpenses.length} transacciones</span>
                        </div>

                        <div className={styles.list}>
                            {filteredExpenses.map(expense => (
                                <div key={expense.id} className={styles.expenseItem}>
                                    <div className={`${styles.icon} ${styles[expense.category]}`}>
                                        {expense.category === 'school' && <IconSchool size={20} />}
                                        {expense.category === 'medical' && <IconMedical size={20} />}
                                        {expense.category === 'clothing' && <IconClothing size={20} />}
                                        {expense.category === 'other' && <IconWallet size={20} />}
                                        {expense.category === 'fund' && <IconWallet size={20} />}
                                        {expense.category as string === 'transfer' && <IconWallet size={20} />}
                                    </div>
                                    <div className={styles.details}>
                                        <div className={styles.expenseTitle}>{expense.title}</div>
                                        <div className={styles.expenseMeta}>
                                            {new Date(expense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} • Pagado por {expense.payer === 'dad' ? 'Papá' : 'Mamá'}
                                        </div>
                                    </div>
                                    <div className={styles.expenseAmount}>
                                        {expense.amount.toFixed(2)}€
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'payments' && (
                    <div className={styles.paymentForm}>
                        <h3>Enviar o Solicitar Dinero</h3>
                        <div className={styles.toggleType}>
                            <button
                                className={`${styles.typeBtn} ${paymentType === 'request' ? styles.activeType : ''}`}
                                onClick={() => setPaymentType('request')}
                            >
                                Solicitar
                            </button>
                            <button
                                className={`${styles.typeBtn} ${paymentType === 'send' ? styles.activeType : ''}`}
                                onClick={() => setPaymentType('send')}
                            >
                                Enviar
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className={styles.formGroup}>
                                <label>Asunto / Concepto</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Mitad clases de inglés"
                                    value={paymentSubject}
                                    onChange={(e) => setPaymentSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Cantidad (€)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                {paymentType === 'request' ? 'Enviar Solicitud' : 'Realizar Pago'}
                            </button>
                        </form>

                        {paymentRequests.length > 0 && (
                            <div className={styles.pendingSection}>
                                <h4>Solicitudes Pendientes</h4>
                                <div className={styles.requestsList}>
                                    {paymentRequests.map(req => (
                                        <div key={req.id} className={styles.requestCard}>
                                            <div className={styles.requestInfo}>
                                                <span className={styles.requestTitle}>{req.title}</span>
                                                <span className={styles.requestMeta}>
                                                    {req.type === 'request' ? 'Solicitado' : 'Enviado'} el {new Date(req.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className={styles.requestAmount}>{req.amount.toFixed(2)}€</span>
                                            </div>
                                            <div className={styles.requestActions}>
                                                <button
                                                    className={styles.payBtn}
                                                    onClick={() => handleAcceptRequest(req)}
                                                >
                                                    {req.type === 'request' ? 'Pagar' : 'Confirmar'}
                                                </button>
                                                <button
                                                    className={styles.cancelBtnSmall}
                                                    onClick={() => handleCancelRequest(req.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'funds' && (
                    <div className={styles.fundsList}>
                        <div className={styles.fundsHeader}>
                            <h3>Fondos Específicos</h3>
                            <button
                                className={styles.smallAddBtn}
                                onClick={() => setIsFundModalOpen(true)}
                            >
                                + Nuevo
                            </button>
                        </div>
                        {funds.map(fund => (
                            <div key={fund.id} className={styles.fundCard}>
                                <div className={styles.fundInfo}>
                                    <div className={styles.fundTitle}>{fund.title}</div>
                                    <div className={styles.fundProgressText}>
                                        {fund.currentAmount}€ / {fund.targetAmount}€
                                    </div>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.min(100, (fund.currentAmount / (fund.targetAmount || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'predictions' && (
                    <div className={styles.predictionsContainer}>
                        <div className={styles.predictionCard}>
                            <h3>🤖 Predicción Próximo Mes</h3>
                            <div className={styles.predictionAmount}>
                                {predictedNextMonth}€
                                <span className={styles.trendUp}> (+{(predictedNextMonth - monthlyAverage) / monthlyAverage * 100}%) 📈</span>
                            </div>
                            <p className={styles.predictionSubtext}>Basado en tus gastos recurrentes y la temporada.</p>
                        </div>

                        <div className={styles.insightsList}>
                            <h4>💡 Insights Inteligentes</h4>
                            {insights.map((insight, idx) => (
                                <div key={idx} className={styles.insightItem}>
                                    {insight}
                                </div>
                            ))}
                        </div>

                        <div className={styles.chartPlaceholder}>
                            <h4>Tendencia de Gastos (Últimos 6 meses)</h4>
                            <div className={styles.bars}>
                                <div className={styles.bar} style={{ height: '60%' }}></div>
                                <div className={styles.bar} style={{ height: '70%' }}></div>
                                <div className={styles.bar} style={{ height: '50%' }}></div>
                                <div className={styles.bar} style={{ height: '80%' }}></div>
                                <div className={styles.bar} style={{ height: '65%' }}></div>
                                <div className={styles.bar} style={{ height: '90%', background: 'var(--primary)' }}></div>
                            </div>
                            <div className={styles.months}>
                                <span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span><span>Ene</span><span>Feb (Est)</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isFundModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsFundModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Nuevo Fondo</h3>
                            <button className={styles.closeBtn} onClick={() => setIsFundModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateFund} className={styles.createForm}>
                            <div className={styles.formGroup}>
                                <label>Nombre del Fondo</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Viaje Escolar"
                                    value={newFundTitle}
                                    onChange={(e) => setNewFundTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Objetivo (€)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newFundTarget}
                                    onChange={(e) => setNewFundTarget(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>Crear Fondo</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
