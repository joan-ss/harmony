"use client";

import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import styles from './FamilyManager.module.css';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

export default function FamilyManager() {
    const { childrenProfiles, selectedChildId, selectChild, addChild, removeChild } = useFamily();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [newColor, setNewColor] = useState(COLORS[0]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addChild(newName, newColor);
            setNewName("");
            setIsAdding(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el perfil de ${name}? Esta acción afectará a ambos padres.`)) {
            removeChild(id);
        }
    };

    return (
        <>
            <div className={styles.managerContainer}>
                <div className={styles.headerRow}>
                    <span className={styles.label}>Familia:</span>
                    <button
                        className={styles.editBtn}
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        {isEditing ? 'Listo' : 'Editar'}
                    </button>
                </div>
                <div className={styles.profileSelector}>
                    <button
                        className={`${styles.profileBtn} ${selectedChildId === 'all' ? styles.active : ''}`}
                        onClick={() => selectChild('all')}
                    >
                        <div className={`${styles.avatar} ${styles.allAvatar}`}>👨‍👩‍👧‍👦</div>
                        <span className={styles.name}>Todos</span>
                    </button>

                    {childrenProfiles.map(child => (
                        <div key={child.id} className={styles.childWrapper}>
                            <button
                                className={`${styles.profileBtn} ${selectedChildId === child.id ? styles.active : ''}`}
                                onClick={() => selectChild(child.id)}
                                style={{ '--child-color': child.color } as React.CSSProperties}
                            >
                                <div
                                    className={styles.avatar}
                                    style={{ backgroundColor: child.color }}
                                >
                                    {child.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.name}>{child.name}</span>
                            </button>
                            {isEditing && (
                                <button
                                    className={styles.deleteBadge}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(child.id, child.name);
                                    }}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}

                    {childrenProfiles.length < 10 && (
                        <button
                            className={styles.addBtn}
                            onClick={() => setIsAdding(true)}
                            title="Añadir hijo"
                        >
                            +
                        </button>
                    )}
                </div>
            </div>

            {isAdding && (
                <div className={styles.modalOverlay} onClick={() => setIsAdding(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3>Añadir Nuevo Perfil</h3>
                        <form onSubmit={handleAdd}>
                            <input
                                type="text"
                                placeholder="Nombre del hijo/a"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className={styles.input}
                                autoFocus
                                required
                            />
                            <div className={styles.colorGrid}>
                                {COLORS.map(c => (
                                    <div
                                        key={c}
                                        className={`${styles.colorSwatch} ${newColor === c ? styles.selectedColor : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setNewColor(c)}
                                    />
                                ))}
                            </div>
                            <div className={styles.actions}>
                                <button type="button" onClick={() => setIsAdding(false)} className={styles.cancelBtn}>Cancelar</button>
                                <button type="submit" className={styles.saveBtn}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
