import { Inter } from "next/font/google"
import "./globals.css"


const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Inventory Management System",
  description: "Modern inventory management for industrial components",
  generator: 'v0.dev',
  icons: {
    icon: '/assests/fav.png',
    shortcut: '/assests/fav.png',
    apple: '/assests/fav.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
