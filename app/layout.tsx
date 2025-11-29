import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firestore Backup Restore GUI",
  description: "Beautiful GUI for Firestore backup restore operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

