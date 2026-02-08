"use client";

import { useState } from "react";
import styles from "./SidebarMenu.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { IconUser, IconUsers, IconSettings, IconShield, IconHelp, IconCopy, IconCheck } from "./Icons";

interface SidebarMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
    const { signOut, profile, isDemo } = useAuth();
    const [isAccountExpanded, setIsAccountExpanded] = useState(false);
    const [isFamilyExpanded, setIsFamilyExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleLogout = async () => {
        await signOut();
        onClose();
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const familyCode = profile?.family_id || "PROX-2026-DEMO";

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sidebar} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Menú</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </header>

                <div className={styles.menuItems}>
                    <div className={styles.menuGroup}>
                        <button
                            className={`${styles.menuItem} ${isAccountExpanded ? styles.active : ''}`}
                            onClick={() => setIsAccountExpanded(!isAccountExpanded)}
                        >
                            <span className={styles.icon}><IconUser size={20} /></span>
                            <span className={styles.label}>Cuenta</span>
                            <span className={styles.arrow}>{isAccountExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isAccountExpanded && (
                            <div className={styles.submenu}>
                                <div className={styles.profileCard}>
                                    <div className={styles.avatarLarge}><IconUser size={40} color="var(--primary)" /></div>
                                    <div className={styles.profileInfo}>
                                        <div className={styles.field}>
                                            <label>Nombre</label>
                                            <p>Carlos (Papá)</p>
                                        </div>
                                        <div className={styles.field}>
                                            <label>Descripción</label>
                                            <p>Padre de 2 hijos. Me gustan los fines de semana de fútbol.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.menuGroup}>
                        <button
                            className={`${styles.menuItem} ${isFamilyExpanded ? styles.active : ''}`}
                            onClick={() => setIsFamilyExpanded(!isFamilyExpanded)}
                        >
                            <span className={styles.icon}><IconUsers size={20} /></span>
                            <span className={styles.label}>Familia</span>
                            <span className={styles.arrow}>{isFamilyExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isFamilyExpanded && (
                            <div className={styles.submenu}>
                                <div className={styles.familySection}>
                                    <p className={styles.familyHint}>Comparte este código para que otros se unan:</p>
                                    <div className={styles.codeContainer}>
                                        <code className={styles.codeValue}>{familyCode}</code>
                                        <button
                                            className={styles.copyBtn}
                                            onClick={() => handleCopyCode(familyCode)}
                                        >
                                            {copied ? <IconCheck size={18} color="var(--primary)" /> : <IconCopy size={18} />}
                                        </button>
                                    </div>
                                    {copied && <span className={styles.copiedFeedback}>¡Código copiado!</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.divider}></div>

                    <button className={styles.menuItem}>
                        <span className={styles.icon}><IconSettings size={20} /></span>
                        <span className={styles.label}>Ajustes</span>
                    </button>

                    <button className={styles.menuItem}>
                        <span className={styles.icon}><IconShield size={20} /></span>
                        <span className={styles.label}>Política y Privacidad</span>
                    </button>

                    <button className={styles.menuItem}>
                        <span className={styles.icon}><IconHelp size={20} /></span>
                        <span className={styles.label}>Ayuda</span>
                    </button>

                    <div className={`${styles.statusIndicator} ${isDemo ? styles.statusDemo : styles.statusLive}`}>
                        <div className={styles.statusDot}></div>
                        <span>{isDemo ? 'Modo Demo (Local)' : 'Supabase Conectado'}</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar Sesión</button>
                </div>
            </div>
        </div>
    );
}
