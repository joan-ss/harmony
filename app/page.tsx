"use client";
import { useState } from "react";
import Link from "next/link";
import FamilyManager from "@/components/FamilyManager";
import SidebarMenu from "@/components/SidebarMenu";
import styles from "./page.module.css";
import { useFamily } from "@/contexts/FamilyContext";
import { IconUser, IconBell, IconCalendar, IconWallet, IconMessage } from "@/components/Icons";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { events } = useFamily();

  // Find the next upcoming event
  const today = new Date().toISOString().split('T')[0];
  const nextEvent = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Harmony</div>
        <div className={styles.profileIcon} onClick={() => setIsMenuOpen(true)}>
          <IconUser size={20} color="var(--primary)" />
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Panel de Control</h1>
        <p className={styles.subtitle}>
          Tu centro de mando para una coparentalidad organizada.
        </p>

        <FamilyManager />

        <div className={styles.grid}>
          {nextEvent && (
            <Link href="/calendar" className={`${styles.card} ${styles.summaryCard}`}>
              <h2><IconBell size={24} color="white" /> Próximo Evento</h2>
              <div className={styles.nextEvent}>
                <span className={styles.eventTitle}>{nextEvent.title}</span>
                <span className={styles.eventMeta}>
                  {new Date(nextEvent.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  • {nextEvent.type === 'activity' ? 'Actividad' : nextEvent.type === 'custody' ? 'Custodia' : 'Gasto'}
                </span>
              </div>
              <p>Prepárate para lo que viene en la agenda familiar.</p>
            </Link>
          )}

          <Link href="/calendar" className={styles.card}>
            <h2><IconCalendar size={24} color="var(--primary)" /> Calendario</h2>
            <p>Gestiona visitas, citas médicas y eventos escolares sin conflictos.</p>
          </Link>
          <Link href="/expenses" className={styles.card}>
            <h2><IconWallet size={24} color="var(--primary)" /> Gastos</h2>
            <p>Registra tickets y liquida cuentas de forma transparente y equitativa.</p>
          </Link>
          <Link href="/chat" className={styles.card}>
            <h2><IconMessage size={24} color="var(--primary)" /> Mensajes</h2>
            <p>Comunícate de forma asertiva con el apoyo de nuestro asistente IA.</p>
          </Link>
        </div>
      </main>

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
