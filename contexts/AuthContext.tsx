"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
    id: string;
    family_id: string | null;
    role: 'mom' | 'dad' | 'child' | null;
    name: string | null;
}

interface AuthContextType {
    user: any | null; // Use any to allow mock user objects
    profile: Profile | null;
    session: any | null;
    loading: boolean;
    isDemo: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    // Initial load
    useEffect(() => {
        const initAuth = async () => {
            // Try real Supabase first
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setSession(session);
                    setUser(session.user);
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    setProfile(profile);
                    setIsDemo(false);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.warn('Supabase not available, using Demo Mode');
            }

            // Fallback to Demo Mode (LocalStorage)
            const demoUser = localStorage.getItem('harmony_demo_user');
            if (demoUser) {
                const parsed = JSON.parse(demoUser);
                setUser(parsed.user);
                setProfile(parsed.profile);
                setIsDemo(true);
            }
            setLoading(false);
        };

        initAuth();

        // Listen for real auth changes if available
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                setProfile(profile);
                setIsDemo(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error && data.session) return; // Handled by onAuthStateChange
            throw error;
        } catch (e) {
            // Demo Sign In
            const mockUser = { id: 'demo-user', email };
            const mockProfile: Profile = { id: 'demo-user', family_id: null, role: null, name: email.split('@')[0] };
            setUser(mockUser);
            setProfile(mockProfile);
            setIsDemo(true);
            localStorage.setItem('harmony_demo_user', JSON.stringify({ user: mockUser, profile: mockProfile }));
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (!error) return;
            throw error;
        } catch (e) {
            // Demo Sign Up
            await signIn(email, password);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        setIsDemo(false);
        localStorage.removeItem('harmony_demo_user');
    };

    const refreshProfile = async () => {
        if (isDemo) {
            const stored = localStorage.getItem('harmony_demo_user');
            if (stored) setProfile(JSON.parse(stored).profile);
        } else if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (isDemo) {
            const newProfile = { ...profile, ...updates } as Profile;
            setProfile(newProfile);
            localStorage.setItem('harmony_demo_user', JSON.stringify({ user, profile: newProfile }));
        } else if (user) {
            await supabase.from('profiles').update(updates).eq('id', user.id);
            await refreshProfile();
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            isDemo,
            signIn,
            signUp,
            signOut,
            refreshProfile,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
