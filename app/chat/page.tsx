import ChatInterface from "../../components/ChatInterface";
import styles from "./page.module.css";

export default function ChatPage() {
    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <ChatInterface />
            </main>
        </div>
    );
}
