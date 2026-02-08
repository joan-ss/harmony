import DocumentVault from "../../components/DocumentVault";
import styles from "./page.module.css";
import Link from 'next/link';

export default function DocumentsPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.topNav}>
                    <Link href="/" className={styles.homeLink}>← Volver al Inicio</Link>
                    <h1 className={styles.logo}>Harmony</h1>
                </div>
                <h2 className={styles.pageTitle}>Documentación</h2>
            </header>

            <main className={styles.main}>
                <DocumentVault />
            </main>
        </div>
    );
}
