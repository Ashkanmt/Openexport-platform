export const metadata = {
  title: "OpenExport",
  description: "Connect and chat with buyers, suppliers and trade partners worldwide.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
