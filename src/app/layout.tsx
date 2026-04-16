import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import ReduxProvider from "@/store/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TalentPulse | Algorithme de Matching IA Pro",
  description: "Évaluez instantanément la pertinence d'un CV par rapport à une fiche de poste grâce à l'IA.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
