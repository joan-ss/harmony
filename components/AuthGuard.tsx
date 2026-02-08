"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== "/login") {
                router.push("/login");
            } else if (user && !profile?.family_id && pathname !== "/onboarding") {
                router.push("/onboarding");
            } else if (user && profile?.family_id && (pathname === "/onboarding" || pathname === "/login")) {
                router.push("/");
            }
        }
    }, [user, profile, loading, pathname, router]);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--app-bg)',
                color: '#1a2a4b',
                fontWeight: 700
            }}>
                Cargando Harmony...
            </div>
        );
    }

    return <>{children}</>;
}
