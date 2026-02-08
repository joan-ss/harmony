"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState('');
    const { signIn, signUp } = useAuth();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                await signUp(email, password);
                setMessage('Modo Demo Activo: Cuenta simulada creada.');
            } else {
                await signIn(email, password);
            }
        } catch (error: any) {
            setMessage(error.message || 'Ocurrió un error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <h1 className={styles.logo}>Harmony</h1>
                <p className={styles.subtitle}>Conectando familias con paz</p>

                <form onSubmit={handleAuth} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    {message && <p className={styles.message}>{message}</p>}

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Cargando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
                    </button>

                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>
                        Nota: Si no has configurado Supabase, se usará el <b>Modo Demo</b> (los datos se guardan solo en este navegador).
                    </p>
                </form>

                <p className={styles.toggleText}>
                    {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button onClick={() => setIsSignUp(!isSignUp)} className={styles.toggleBtn}>
                        {isSignUp ? 'Inicia sesión' : 'Regístrate aquí'}
                    </button>
                </p>
            </div>
        </div>
    );
}
