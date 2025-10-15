import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: "LeoQui | AI Learning Platform for Students, Parents & Teachers",
  description: "Discover LeoQui, the AI-powered learning companion that personalises tutoring, homework help, and classroom collaboration for students, parents, and teachers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
