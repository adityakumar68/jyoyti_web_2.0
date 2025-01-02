"use client"
import { Inter } from "next/font/google";
import { RecoilRoot } from "recoil";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });



export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RecoilRoot>
          {children}
        </RecoilRoot>
      </body>
    </html>
  );
}