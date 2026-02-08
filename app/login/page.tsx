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
    const { signIn, signUp, isDemo } = useAuth();

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

                    <div style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '8px', background: isDemo ? '#fff4e5' : '#e6fffa', border: `1px solid ${isDemo ? '#ffd5a1' : '#b2f5ea'}`, fontSize: '0.8rem', color: isDemo ? '#b76e00' : '#008673', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isDemo ? '#ff9800' : '#38b2ac', boxShadow: `0 0 5px ${isDemo ? '#ff9800' : '#38b2ac'}` }}></div>
                        {isDemo ? (
                            <span><b>Modo Demo:</b> Supabase no detectado. Los datos no se guardarán en la nube.</span>
                        ) : (
                            <span><b>Conectado:</b> Base de datos Supabase activa y lista.</span>
                        )}
                    </div>
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
