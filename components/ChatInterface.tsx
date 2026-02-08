"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./ChatInterface.module.css";
import { useFamily } from "@/contexts/FamilyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { IconUsers, IconBot, IconUser, IconPlus, IconPaperclip, IconCamera, IconBell } from "./Icons";

interface Message {
    id: string;
    text: string;
    sender: string; // Changed to string for user_id
    timestamp: string;
    channelId: string;
    family_id: string;
    attachment?: {
        type: "image" | "file";
        url: string;
        name: string;
    };
}

interface Channel {
    id: string;
    name: string;
    type: "family" | "partner" | "child";
    avatar: string;
    color?: string;
}

export default function ChatInterface() {
    const { profile, user, isDemo } = useAuth();
    const { childrenProfiles, events } = useFamily();
    const [activeChannelId, setActiveChannelId] = useState<string>("family");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial messages load
    useEffect(() => {
        const loadMessages = async () => {
            if (isDemo) {
                setMessages([
                    { id: "1", text: "¡Hola a todos! ¿Qué tal el día?", sender: "other", timestamp: "09:00 AM", channelId: "family", family_id: "demo" },
                    { id: "2", text: "Todo bien, en el cole.", sender: "me", timestamp: "09:05 AM", channelId: "family", family_id: "demo" },
                    { id: "5", text: "¡Hola! Soy tu asistente de Harmony. Puedo ayudarte con recordatorios del calendario o consejos de comunicación.", sender: "ai", timestamp: "10:35 AM", channelId: "ai-assistant", family_id: "demo" },
                ]);
            } else if (profile?.family_id) {
                const { data } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('family_id', profile.family_id)
                    .order('created_at', { ascending: true });

                if (data) setMessages(data);

                // Subscription
                const subscription = supabase
                    .channel('messages_changes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `family_id=eq.${profile.family_id}` },
                        payload => {
                            setMessages(prev => [...prev, payload.new as Message]);
                        })
                    .subscribe();

                return () => subscription.unsubscribe();
            }
            setLoading(false);
        };

        loadMessages();
    }, [isDemo, profile]);

    // Generate channels dynamically
    const channels: Channel[] = [
        { id: "family", name: "Familia", type: "family", avatar: "users" },
        { id: "partner", name: "Mamá/Papá", type: "partner", avatar: "user" },
        { id: "ai-assistant", name: "Asistente AI", type: "family", avatar: "bot", color: "var(--primary)" },
        ...childrenProfiles.map(child => ({
            id: child.id,
            name: child.name,
            type: "child" as const,
            avatar: "child",
            color: child.color
        }))
    ];

    const [inputValue, setInputValue] = useState("");
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeMessages = messages.filter(m => m.channelId === activeChannelId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeMessages, activeChannelId]);

    const dangerousWords = ["idiota", "estupido", "irresponsable", "nunca", "siempre", "mentiroso", "vago"];

    const checkHarmony = (text: string): string | null => {
        const lowerText = text.toLowerCase();
        const found = dangerousWords.some(word => lowerText.includes(word));

        if (found) {
            if (lowerText.includes("idiota") || lowerText.includes("estupido")) return "No estoy de acuerdo con tu decisión.";
            if (lowerText.includes("irresponsable")) return "Me preocupa que no se cumplan los compromisos.";
            if (lowerText.includes("nunca") || lowerText.includes("siempre")) return "Me gustaría que revisemos la frecuencia de esto.";
            if (lowerText.includes("mentiroso") || lowerText.includes("vago")) return "Creo que hubo un malentendido.";
            return "Podríamos expresarlo de una forma más constructiva.";
        }
        return null;
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Skip harmony check for AI Assistant channel
        if (activeChannelId !== "ai-assistant") {
            const improvement = checkHarmony(inputValue);
            if (improvement) {
                setSuggestion(improvement);
                return;
            }
        }

        sendMessage(inputValue);
    };

    const getAICalendarReply = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        const today = new Date().toISOString().split('T')[0];

        if (lowerQuery.includes("calendario") || lowerQuery.includes("hoy") || lowerQuery.includes("actividades") || lowerQuery.includes("tenemos")) {
            const upcomingEvents = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

            if (upcomingEvents.length === 0) {
                return "No he encontrado actividades próximas en el calendario. ¡Parece que tenéis unos días tranquilos!";
            }

            let response = "Esto es lo que he encontrado en vuestro calendario:\n\n";
            upcomingEvents.forEach(e => {
                const date = new Date(e.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                response += `• **${e.title}** (${date}) - Tipo: ${e.type === 'activity' ? 'Actividad' : e.type === 'custody' ? 'Custodia' : 'Gasto'}\n`;
            });
            return response;
        }

        if (lowerQuery.includes("hola") || lowerQuery.includes("ayuda")) {
            return "¡Hola! Puedo ayudarte a revisar el calendario familiar o darte consejos sobre cómo comunicarte mejor. Prueba a preguntarme: '¿Qué actividades hay próximamente?'";
        }

        return "Entiendo. Si necesitas que revise el calendario o te ayude con alguna gestión familiar, solo dímelo.";
    };

    const sendMessage = async (text: string, attachment?: Message['attachment']) => {
        const newMessageData = {
            text,
            sender: user?.id || "demo-user",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            channelId: activeChannelId,
            family_id: profile?.family_id || "demo",
            attachment
        };

        if (isDemo) {
            setMessages([...messages, { id: Date.now().toString(), ...newMessageData } as Message]);
            setInputValue("");
            setSuggestion(null);

            // AI specific reply mock
            if (activeChannelId === "ai-assistant") {
                setTimeout(() => {
                    const aiReply: Message = {
                        id: (Date.now() + 1).toString(),
                        text: getAICalendarReply(text),
                        sender: "ai",
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        channelId: "ai-assistant",
                        family_id: "demo"
                    };
                    setMessages(prev => [...prev, aiReply]);
                }, 1000);
            }
        } else if (profile?.family_id) {
            await supabase.from('messages').insert([newMessageData]);
            setInputValue("");
            setSuggestion(null);

            // AI specific reply (handled by logic here, but should ideally be a server function)
            if (activeChannelId === "ai-assistant") {
                const aiReplyData = {
                    text: getAICalendarReply(text),
                    sender: "ai",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    channelId: "ai-assistant",
                    family_id: profile.family_id
                };
                await supabase.from('messages').insert([aiReplyData]);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                sendMessage("Foto enviada", {
                    type: "image",
                    url: ev.target?.result as string,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        } else {
            sendMessage(`Archivo: ${file.name}`, {
                type: "file",
                url: "#",
                name: file.name
            });
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const acceptSuggestion = () => {
        if (suggestion) sendMessage(suggestion);
    };

    const ignoreSuggestion = () => {
        sendMessage(inputValue);
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <h3 className={styles.sidebarTitle}>Chats</h3>
                <div className={styles.channelList}>
                    {channels.map(channel => (
                        <div
                            key={channel.id}
                            className={`${styles.channelItem} ${activeChannelId === channel.id ? styles.activeChannel : ''}`}
                            onClick={() => setActiveChannelId(channel.id)}
                            style={channel.color ? { borderLeft: `4px solid ${channel.color}` } : {}}
                        >
                            <span className={styles.channelAvatar}>
                                {channel.avatar === 'users' && <IconUsers size={20} />}
                                {channel.avatar === 'user' && <IconUser size={20} />}
                                {channel.avatar === 'bot' && <IconBot size={20} color="var(--primary)" />}
                                {channel.avatar === 'child' && <IconUser size={20} color={channel.color || "var(--text-light)"} />}
                            </span>
                            <span className={styles.channelName}>{channel.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.chatArea}>
                <div className={styles.chatHeader}>
                    <span className={styles.headerTitle}>
                        {channels.find(c => c.id === activeChannelId)?.name}
                    </span>
                    <span className={styles.headerSubtitle}>
                        {activeChannelId === 'family' ? 'Todos los miembros' :
                            activeChannelId === 'partner' ? 'Privado con pareja' :
                                activeChannelId === 'ai-assistant' ? 'Asistente Inteligente' : 'Privado'}
                    </span>
                </div>

                <div className={styles.chatWindow}>
                    {activeMessages.length === 0 ? (
                        <div className={styles.emptyState}>No hay mensajes en este chat aún.</div>
                    ) : (
                        activeMessages.map((msg) => (
                            <div key={msg.id} className={`${styles.message} ${msg.sender === (user?.id || 'demo-user') ? styles.me : styles.other} ${activeChannelId === 'ai-assistant' && msg.sender === 'ai' ? styles.ai : ''}`}>
                                <div className={styles.bubble}>
                                    {msg.attachment?.type === 'image' && (
                                        <div className={styles.attachmentWrapper}>
                                            <IconCamera size={16} className={styles.attachmentIcon} />
                                            <img src={msg.attachment.url} alt="adjunto" className={styles.attachmentImage} />
                                        </div>
                                    )}
                                    {msg.attachment?.type === 'file' && (
                                        <div className={styles.attachmentFile}><IconPaperclip size={16} /> {msg.attachment.name}</div>
                                    )}
                                    <div>{msg.text}</div>
                                </div>
                                <div className={styles.time}>{msg.timestamp}</div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {suggestion && (
                    <div className={styles.suggestionModal}>
                        <div className={styles.suggestionContent}>
                            <h4><IconBell size={18} color="var(--accent)" /> Sugerencia de Harmony AI</h4>
                            <p>Tu mensaje original podría generar tensión. ¿Te gustaría enviar esta versión más constructiva?</p>
                            <div className={styles.preview}>&quot;{suggestion}&quot;</div>
                            <div className={styles.suggestionActions}>
                                <button onClick={acceptSuggestion} className={styles.acceptBtn}>Usar sugerencia</button>
                                <button onClick={ignoreSuggestion} className={styles.ignoreBtn}>Enviar original</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.inputArea}>
                    <div className={styles.actions}>
                        <button
                            className={styles.iconBtn}
                            title="Adjuntar archivo"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <IconPaperclip size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                    </div>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder={`Mensaje en ${channels.find(c => c.id === activeChannelId)?.name}...`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} className={styles.sendBtn}>Enviar</button>
                </div>
            </div>
        </div>
    );
}
