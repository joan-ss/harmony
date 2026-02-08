"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './onboarding.module.css';

export default function OnboardingPage() {
    const { user, profile, refreshProfile, isDemo, updateProfile } = useAuth();
    const [step, setStep] = useState(profile?.name ? 'family' : 'profile'); // 'profile' or 'family'
    const [name, setName] = useState(profile?.name || '');
    const [role, setRole] = useState<'mom' | 'dad' | 'child'>(profile?.role || 'mom');
    const [familyName, setFamilyName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await updateProfile({ name, role });
            setStep('family');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            if (isDemo) {
                // Mock family creation in localStorage
                const familyId = `demo-fam-${Date.now()}`;
                const storedFamilies = localStorage.getItem('harmony_demo_families');
                const families = storedFamilies ? JSON.parse(storedFamilies) : {};
                families[familyId] = { name: familyName, invite_code: code, children: [], events: [] };
                localStorage.setItem('harmony_demo_families', JSON.stringify(families));

                await updateProfile({ family_id: familyId });
            } else {
                // Real creation will be handled once user completes Supabase setup
            }
            await refreshProfile();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            if (isDemo) {
                const storedFamilies = localStorage.getItem('harmony_demo_families');
                const families = storedFamilies ? JSON.parse(storedFamilies) : {};
                const familyEntry = Object.entries(families).find(([_, f]: any) => f.invite_code === inviteCode.toUpperCase());

                if (!familyEntry) throw new Error('Código de invitación no válido en modo demo');

                await updateProfile({ family_id: familyEntry[0] });
            }
            await refreshProfile();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.onboardingContainer}>
            <div className={styles.card}>
                {step === 'profile' ? (
                    <>
                        <h2>Bienvenido a Harmony</h2>
                        <p>Dinos quién eres para empezar</p>
                        <form onSubmit={handleCreateProfile} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Tu Nombre</label>
                                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. María" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Tu Rol</label>
                                <select value={role} onChange={e => setRole(e.target.value as any)}>
                                    <option value="mom">Mamá</option>
                                    <option value="dad">Papá</option>
                                    <option value="child">Hijo/a</option>
                                </select>
                            </div>
                            {error && <p className={styles.error}>{error}</p>}
                            <button type="submit" className={styles.submitBtn} disabled={isLoading}>Continuar</button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2>Configura tu Familia</h2>
                        <div className={styles.options}>
                            <div className={styles.optionSection}>
                                <h3>Crear Nueva Familia {isDemo && '(Simulado)'}</h3>
                                <form onSubmit={handleCreateFamily}>
                                    <input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="Nombre de la familia" required />
                                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>Crear</button>
                                </form>
                            </div>
                            <div className={styles.divider}>O</div>
                            <div className={styles.optionSection}>
                                <h3>Unirse con Código</h3>
                                <form onSubmit={handleJoinFamily}>
                                    <input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Código (Ene. ABC123)" required />
                                    <button type="submit" className={styles.secondaryBtn} disabled={isLoading}>Unirme</button>
                                </form>
                            </div>
                        </div>
                        {error && <p className={styles.error}>{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
