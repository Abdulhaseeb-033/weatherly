import "./globals.css";

export const metadata = {
  title: "Weatherly - Understand Your Weather",
  description: "Weather helps you understand what the weather means for your day.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
