"use client";

import { useState, useEffect } from "react";
import { useFamily } from "@/contexts/FamilyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./DocumentVault.module.css";

interface DocFile {
    id: string;
    name: string;
    type: "pdf" | "img" | "doc";
    date: string;
    size: string;
    child_id: string;
    family_id?: string;
}

export default function DocumentVault() {
    const { profile, isDemo } = useAuth();
    const { childrenProfiles } = useFamily();
    const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null = root (folders view), string = childId
    const [flatFiles, setFlatFiles] = useState<DocFile[]>([]);

    // Initial load
    useEffect(() => {
        const loadDocs = async () => {
            if (isDemo) {
                setFlatFiles([
                    { id: "101", name: "Matrícula 2024.pdf", type: "pdf", date: "12/09/2023", size: "1.2 MB", child_id: "1" },
                    { id: "102", name: "Vacunación.jpg", type: "img", date: "15/01/2024", size: "2.4 MB", child_id: "1" }
                ]);
            } else if (profile?.family_id) {
                const { data } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('family_id', profile.family_id);

                if (data) setFlatFiles(data);

                // Realtime
                const subscription = supabase
                    .channel('docs')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `family_id=eq.${profile.family_id}` }, p => {
                        if (p.eventType === 'INSERT') setFlatFiles(v => [...v, p.new as DocFile]);
                        if (p.eventType === 'DELETE') setFlatFiles(v => v.filter(f => f.id !== p.old.id));
                    })
                    .subscribe();

                return () => subscription.unsubscribe();
            }
        };
        loadDocs();
    }, [isDemo, profile]);

    // Group files for the UI
    const files: Record<string, DocFile[]> = flatFiles.reduce((acc, file) => {
        if (!acc[file.child_id]) acc[file.child_id] = [];
        acc[file.child_id].push(file);
        return acc;
    }, {} as Record<string, DocFile[]>);

    const getChildName = (id: string) => childrenProfiles.find(c => c.id === id)?.name || "Desconocido";
    const getChildColor = (id: string) => childrenProfiles.find(c => c.id === id)?.color || "#ccc";

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentFolder || !e.target.files?.[0]) return;

        const file = e.target.files[0];
        const docData = {
            name: file.name,
            type: (file.name.endsWith(".pdf") ? "pdf" : "img") as "pdf" | "img",
            date: new Date().toLocaleDateString(),
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            child_id: currentFolder,
            family_id: profile?.family_id
        };

        if (isDemo) {
            setFlatFiles([...flatFiles, { id: Date.now().toString(), ...docData } as DocFile]);
        } else if (profile?.family_id) {
            await supabase.from('documents').insert([docData]);
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!currentFolder || !confirm("¿Borrar documento?")) return;

        if (isDemo) {
            setFlatFiles(flatFiles.filter(f => f.id !== fileId));
        } else if (profile?.family_id) {
            await supabase.from('documents').delete().eq('id', fileId);
        }
    };

    return (
        <div className={styles.vaultContainer}>
            {/* Breadcrumb / Header */}
            <div className={styles.header}>
                {currentFolder ? (
                    <button onClick={() => setCurrentFolder(null)} className={styles.backBtn}>
                        ← Volver a Documentos
                    </button>
                ) : (
                    <h2 className={styles.title}>Carpetas Familiares</h2>
                )}
            </div>

            {!currentFolder ? (
                /* Folders Grid */
                <div className={styles.foldersGrid}>
                    {childrenProfiles.map(child => (
                        <div
                            key={child.id}
                            className={styles.folderCard}
                            onClick={() => setCurrentFolder(child.id)}
                            style={{ borderTopColor: child.color }}
                        >
                            <div className={styles.folderIcon} style={{ color: child.color }}>📁</div>
                            <div className={styles.folderName}>{child.name}</div>
                            <div className={styles.fileCount}>
                                {(files[child.id] || []).length} archivos
                            </div>
                        </div>
                    ))}
                    {childrenProfiles.length === 0 && (
                        <div className={styles.emptyState}>
                            No hay perfiles creados. Añade hijos en el menú principal.
                        </div>
                    )}
                </div>
            ) : (
                /* Files View */
                <div className={styles.filesView}>
                    <div className={styles.folderHeader}>
                        <h3 style={{ color: getChildColor(currentFolder) }}>
                            📁 Carpeta de {getChildName(currentFolder)}
                        </h3>
                        <label className={styles.uploadBtn}>
                            + Subir Archivo
                            <input type="file" hidden onChange={handleUpload} />
                        </label>
                    </div>

                    <div className={styles.filesList}>
                        {(files[currentFolder] || []).length === 0 ? (
                            <div className={styles.emptyFolder}>Carpeta vacía. Sube el primer documento.</div>
                        ) : (
                            (files[currentFolder] || []).map(file => (
                                <div key={file.id} className={styles.fileRow}>
                                    <div className={styles.fileIcon}>
                                        {file.type === 'pdf' ? '📄' : '🖼️'}
                                    </div>
                                    <div className={styles.fileInfo}>
                                        <div className={styles.fileName}>{file.name}</div>
                                        <div className={styles.fileMeta}>{file.date} • {file.size}</div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                        className={styles.deleteBtn}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
