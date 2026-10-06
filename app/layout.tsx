import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: { default: "COOIMEL", template: "%s · COOIMEL" },
  description: "Cooperativa de Irrigação de Meleiro — portal do associado",
  applicationName: "COOIMEL",
};

export const viewport: Viewport = {
  themeColor: "#013220",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
