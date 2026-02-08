"use client";

import styles from "./BottomNav.module.css";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconHome, IconCalendar, IconWallet, IconBook, IconFolder, IconMessage } from "./Icons";

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className={styles.bottomNav}>
            <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
                <span className={styles.navIcon}><IconHome size={22} /></span>
                <span className={styles.navLabel}>Inicio</span>
            </Link>
            <Link href="/calendar" className={`${styles.navItem} ${pathname === '/calendar' ? styles.active : ''}`}>
                <span className={styles.navIcon}><IconCalendar size={22} /></span>
                <span className={styles.navLabel}>Calendario</span>
            </Link>
            <Link href="/expenses" className={`${styles.navItem} ${pathname === '/expenses' ? styles.active : ''}`}>
                <span className={styles.navIcon}><IconWallet size={22} /></span>
                <span className={styles.navLabel}>Gastos</span>
            </Link>
            <Link href="/diary" className={`${styles.navItem} ${pathname === '/diary' ? styles.active : ''}`}>
                <span className={styles.navIcon}><IconBook size={22} /></span>
                <span className={styles.navLabel}>Diario</span>
            </Link>
            <Link href="/documents" className={`${styles.navItem} ${pathname === '/documents' ? styles.active : ''}`}>
                <span className={styles.navIcon}><IconFolder size={22} /></span>
                <span className={styles.navLabel}>Docs</span>
            </Link>
            <Link href="/chat" className={`${styles.navItem} ${pathname === '/chat' ? styles.active : ''}`}>
                <span className={styles.navIcon}><IconMessage size={22} /></span>
                <span className={styles.navLabel}>Mensajes</span>
            </Link>
        </nav>
    );
}
