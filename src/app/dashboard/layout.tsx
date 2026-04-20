"use client";

import LowCreditsBanner from "@/components/LowCreditsBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <LowCreditsBanner />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
