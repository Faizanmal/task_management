import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { ToastProvider } from "./context/toast-context";
import { ToastContainer } from "./components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management System",
  description: "Manage your tasks efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
