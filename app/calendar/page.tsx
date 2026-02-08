import CalendarBoard from "../../components/CalendarBoard";
import styles from "./page.module.css";

export default function CalendarPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Calendario Familiar</h1>
            </header>

            <main className={styles.main}>
                <CalendarBoard />
            </main>
        </div>
    );
}
