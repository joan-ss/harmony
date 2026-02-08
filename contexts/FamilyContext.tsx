"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

export interface Child {
    id: string;
    name: string;
    color: string;
    avatar?: string;
}

export interface Event {
    id: string;
    date: string;
    endDate?: string;
    title: string;
    type: "custody" | "activity" | "expense";
    assignedTo?: "dad" | "mom";
    createdBy: "dad" | "mom";
    childIds?: string[];
    startTime?: string;
    endTime?: string;
}

interface FamilyContextType {
    childrenProfiles: Child[];
    selectedChildId: string | 'all';
    events: Event[];
    addChild: (name: string, color: string) => void;
    selectChild: (id: string | 'all') => void;
    removeChild: (id: string) => void;
    addEvent: (event: Event) => void;
    removeEvent: (id: string) => void;
    isDemo: boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
    const { isDemo, profile } = useAuth();
    const [childrenProfiles, setChildrenProfiles] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string | 'all'>('all');
    const [events, setEvents] = useState<Event[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Initial data loading
    useEffect(() => {
        const loadData = async () => {
            if (isDemo) {
                const storedFamilies = localStorage.getItem('harmony_demo_families');
                const families = storedFamilies ? JSON.parse(storedFamilies) : {};
                const currentFamilyId = profile?.family_id || 'default_demo';
                const familyData = families[currentFamilyId] || {
                    children: [
                        { id: '1', name: 'Ana', color: '#FF6B6B' },
                        { id: '2', name: 'Leo', color: '#4ECDC4' }
                    ],
                    events: [
                        { id: "1", date: "2026-02-14", title: "Cena San Valentín", type: "activity", assignedTo: "mom", createdBy: "mom" },
                        { id: "2", date: "2026-02-15", title: "Pago Clases Piano", type: "expense", createdBy: "dad", childIds: ["1"] },
                        { id: "3", date: "2026-02-20", title: "Fin de semana con Papá", type: "custody", assignedTo: "dad", createdBy: "dad" },
                    ]
                };
                setChildrenProfiles(familyData.children);
                setEvents(familyData.events);
            } else if (profile?.family_id) {
                // Fetch from Supabase
                const { data: childrenData } = await supabase
                    .from('children')
                    .select('*')
                    .eq('family_id', profile.family_id);

                const { data: eventsData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('family_id', profile.family_id);

                if (childrenData) setChildrenProfiles(childrenData);
                if (eventsData) setEvents(eventsData);

                // Setup Realtime subscriptions
                const childrenSubscription = supabase
                    .channel('children_changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'children', filter: `family_id=eq.${profile.family_id}` },
                        payload => {
                            if (payload.eventType === 'INSERT') setChildrenProfiles(prev => [...prev, payload.new as Child]);
                            if (payload.eventType === 'UPDATE') setChildrenProfiles(prev => prev.map(c => c.id === payload.new.id ? payload.new as Child : c));
                            if (payload.eventType === 'DELETE') setChildrenProfiles(prev => prev.filter(c => c.id !== payload.old.id));
                        })
                    .subscribe();

                const eventsSubscription = supabase
                    .channel('events_changes')
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `family_id=eq.${profile.family_id}` },
                        payload => {
                            if (payload.eventType === 'INSERT') setEvents(prev => [...prev, payload.new as Event]);
                            if (payload.eventType === 'UPDATE') setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new as Event : e));
                            if (payload.eventType === 'DELETE') setEvents(prev => prev.filter(e => e.id !== payload.old.id));
                        })
                    .subscribe();

                return () => {
                    childrenSubscription.unsubscribe();
                    eventsSubscription.unsubscribe();
                };
            }
            setInitialized(true);
        };

        if (profile || isDemo) loadData();
    }, [isDemo, profile]);

    const addChild = async (name: string, color: string) => {
        const newChildData = {
            name,
            color,
            family_id: profile?.family_id
        };

        if (isDemo) {
            const newChild: Child = {
                id: Date.now().toString(),
                ...newChildData
            } as Child;
            setChildrenProfiles([...childrenProfiles, newChild]);
        } else if (profile?.family_id) {
            await supabase.from('children').insert([newChildData]);
            // Realtime will update the state
        }
    };

    const removeChild = async (id: string) => {
        if (isDemo) {
            setChildrenProfiles(childrenProfiles.filter(c => c.id !== id));
            if (selectedChildId === id) setSelectedChildId('all');
        } else if (profile?.family_id) {
            await supabase.from('children').delete().eq('id', id);
            if (selectedChildId === id) setSelectedChildId('all');
        }
    };

    const selectChild = (id: string | 'all') => {
        setSelectedChildId(id);
    };

    const addEvent = async (event: Event) => {
        if (isDemo) {
            setEvents(prev => [...prev, event]);
        } else if (profile?.family_id) {
            const { id, ...eventData } = event; // Let Supabase generate ID or use the one provided
            await supabase.from('events').insert([{ ...eventData, family_id: profile.family_id }]);
        }
    };

    const removeEvent = async (id: string) => {
        if (isDemo) {
            setEvents(prev => prev.filter(e => e.id !== id));
        } else if (profile?.family_id) {
            await supabase.from('events').delete().eq('id', id);
        }
    };

    return (
        <FamilyContext.Provider value={{
            childrenProfiles,
            selectedChildId,
            events,
            addChild,
            selectChild,
            removeChild,
            addEvent,
            removeEvent,
            isDemo
        }}>
            {children}
        </FamilyContext.Provider>
    );
}

export function useFamily() {
    const context = useContext(FamilyContext);
    if (context === undefined) {
        throw new Error('useFamily must be used within a FamilyProvider');
    }
    return context;
}
