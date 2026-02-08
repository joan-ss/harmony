"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./SharedDiary.module.css";
import { useFamily } from "@/contexts/FamilyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { IconArrowLeft, IconArrowRight, IconUser, IconCamera } from "./Icons";

interface DiaryEntry {
    id: string;
    date: string;
    text: string;
    image?: string;
    author: "dad" | "mom";
    timestamp: string;
    family_id?: string;
}

export default function SharedDiary() {
    const { profile, isDemo } = useAuth();
    const { selectedChildId, childrenProfiles } = useFamily();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [entryText, setEntryText] = useState("");
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Initial load
    useEffect(() => {
        const loadEntries = async () => {
            if (isDemo) {
                setEntries([
                    {
                        id: "1",
                        date: new Date().toDateString(),
                        text: "Hoy Ana aprendió a andar en bicicleta sin rueditas. ¡Fue muy emocionante!",
                        image: "https://via.placeholder.com/300x200?text=Bici+Ana",
                        author: "dad",
                        timestamp: "10:30 AM"
                    }
                ]);
            } else if (profile?.family_id) {
                const { data } = await supabase
                    .from('diary_entries')
                    .select('*')
                    .eq('family_id', profile.family_id)
                    .order('created_at', { ascending: false });

                if (data) setEntries(data);

                // Realtime
                const subscription = supabase
                    .channel('diary')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'diary_entries', filter: `family_id=eq.${profile.family_id}` }, p => {
                        if (p.eventType === 'INSERT') setEntries(v => [p.new as DiaryEntry, ...v]);
                        if (p.eventType === 'DELETE') setEntries(v => v.filter(e => e.id !== p.old.id));
                    })
                    .subscribe();

                return () => subscription.unsubscribe();
            }
        };
        loadEntries();
    }, [isDemo, profile]);

    const formattedDate = currentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const changeDay = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset);
        setCurrentDate(newDate);
        setEntryText("");
    };

    const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value) {
            setCurrentDate(new Date(e.target.value));
            setEntryText("");
        }
    };

    const handleSaveEntry = async () => {
        if (!entryText.trim()) return;

        const entryData = {
            date: currentDate.toDateString(),
            text: entryText,
            author: profile?.role || "dad",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            family_id: profile?.family_id
        };

        if (isDemo) {
            setEntries([{ id: Date.now().toString(), ...entryData } as DiaryEntry, ...entries]);
        } else if (profile?.family_id) {
            await supabase.from('diary_entries').insert([entryData]);
        }

        setEntryText("");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const entryData = {
                    date: currentDate.toDateString(),
                    text: "📸 Foto del día",
                    image: ev.target?.result as string,
                    author: (profile?.role as "dad" | "mom") || "dad",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    family_id: profile?.family_id
                };

                if (isDemo) {
                    setEntries([{ id: Date.now().toString(), ...entryData } as DiaryEntry, ...entries]);
                } else if (profile?.family_id) {
                    await supabase.from('diary_entries').insert([entryData]);
                }
                setIsUploading(false);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const currentDayEntries = entries.filter(e => e.date === currentDate.toDateString());

    return (
        <div className={styles.notebook}>
            <header className={styles.header}>
                <button onClick={() => changeDay(-1)} className={styles.navBtn}><IconArrowLeft size={24} /></button>
                <div
                    className={styles.dateDisplay}
                    onClick={() => dateInputRef.current?.showPicker()}
                    title="Click para cambiar fecha"
                >
                    <h2>{formattedDate}</h2>
                    <input
                        type="date"
                        ref={dateInputRef}
                        className={styles.hiddenDateInput}
                        value={currentDate.toISOString().split('T')[0]}
                        onChange={handleDateSelect}
                    />
                </div>
                <button onClick={() => changeDay(1)} className={styles.navBtn}><IconArrowRight size={24} /></button>
            </header>

            <div className={styles.pageContent}>
                {currentDayEntries.length === 0 ? (
                    <p className={styles.emptyMsg}>No hay momentos guardados para este día.</p>
                ) : (
                    currentDayEntries.map(entry => (
                        <div key={entry.id} className={styles.entry}>
                            <div className={styles.entryHeader}>
                                <span className={styles.author}><IconUser size={14} /> {entry.author === 'dad' ? 'Papá' : 'Mamá'}</span>
                                <span className={styles.time}>{entry.timestamp}</span>
                            </div>
                            {entry.image && (
                                <div className={styles.imageContainer}>
                                    <img src={entry.image} alt="Recuerdo" className={styles.entryImage} />
                                </div>
                            )}
                            <p className={styles.text}>{entry.text}</p>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.inputArea}>
                <div className={styles.toolbar}>
                    <label className={styles.toolBtn} title="Subir foto">
                        <IconCamera size={20} />
                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
                <textarea
                    className={styles.textarea}
                    placeholder="¿Qué ha pasado hoy de especial?"
                    value={entryText}
                    onChange={(e) => setEntryText(e.target.value)}
                    rows={2}
                ></textarea>
                <button className={styles.saveBtn} onClick={handleSaveEntry} disabled={!entryText.trim()}>
                    Guardar Momento
                </button>
            </div>
        </div>
    );
}
