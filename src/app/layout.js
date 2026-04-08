import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SplashWrapper from "./components/SplashWrapper";
import { AuthProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ChatApp – Real-time Messaging",
  description: "Chat instantly with friends and groups. Secure and fast messaging app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SplashWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SplashWrapper>
      </body>
    </html>
  );
}
