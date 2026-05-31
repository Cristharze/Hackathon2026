import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Fundares · Plataforma de Reciclaje',
  description: 'Plataforma de gestión de reciclaje y sostenibilidad ambiental',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
