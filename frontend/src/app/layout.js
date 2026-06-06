import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import NotificationContainer from "@/components/NotificationContainer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata = {
  title: "Discord Invite Reward Center",
  description:
    "Unlock exclusive Discord Nitro, Robux Gift Cards, and premium rewards by inviting your friends. Join our community and claim your rewards today!",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[#05060A] text-[#F6F8FC] font-sans selection:bg-[#5865F2] selection:text-white">
        {children}
        {/* Global real-time notification toasts */}
        <NotificationContainer />
      </body>
    </html>
  );
}
