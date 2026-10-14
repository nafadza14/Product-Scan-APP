import type { Metadata, Viewport } from "next";
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scanything · What you eat shows on your skin",
  description:
    "Scan food and skincare labels, snap your meals and check your skin with a selfie. Scanything tells you what suits your skin.",
  metadataBase: new URL("https://www.scanything.online"),
  openGraph: {
    title: "Scanything",
    description: "What you eat shows on your skin.",
    url: "https://www.scanything.online",
    siteName: "Scanything",
    images: ["/sites/scanything/apple-touch-icon.png"],
  },
  icons: { apple: "/sites/scanything/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
