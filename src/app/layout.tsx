import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "../components/SidebarWrapper";
import { TopBar } from "../components/ai-studio/components/TopBar";
import { AssetProvider } from "../context/AssetContext";
import { ToasterProvider } from "../components/ToasterProvider";
import { ErrorBoundary } from "../components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "AssetManager - Gestão Patrimonial",
  description: "Sistema de controle patrimonial para múltiplos sócios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-[#f6f6f8] text-[#0d121b] overflow-hidden`} suppressHydrationWarning>
        <ErrorBoundary>
          <AssetProvider>
            <ToasterProvider />
            <div className="flex h-screen overflow-hidden">
              <SidebarWrapper />

              <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <TopBar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                  {children}
                </main>
              </div>
            </div>
          </AssetProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
