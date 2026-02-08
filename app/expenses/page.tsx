import ExpenseTracker from "../../components/ExpenseTracker";
import styles from "./page.module.css";

export default function ExpensesPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Gastos Compartidos</h1>
                <p className={styles.subtitle}>Gestor transparente de finanzas familiares</p>
            </header>

            <main className={styles.main}>
                <ExpenseTracker />
            </main>
        </div>
    );
}
