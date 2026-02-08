import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Import Outfit font
import "./globals.css";
import { FamilyProvider } from "@/contexts/FamilyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit", // Define CSS variable
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Harmony - Coparenting with Peace",
  description: "Una aplicación para gestionar la coparentalidad de forma organizada y respetuosa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={outfit.variable}>
        <AuthProvider>
          <AuthGuard>
            <FamilyProvider>
              <div style={{ paddingBottom: '70px' }}>
                {children}
              </div>
              <BottomNav />
            </FamilyProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
