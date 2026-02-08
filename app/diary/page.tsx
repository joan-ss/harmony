import SharedDiary from "@/components/SharedDiary";
import styles from "./page.module.css";

export default function DiaryPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Diario Compartido</h1>
                <p className={styles.subtitle}>Recuerdos día a día</p>
            </header>

            <main className={styles.main}>
                <SharedDiary />
            </main>
        </div>
    );
}
