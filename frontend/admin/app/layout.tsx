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
    <html lang="es" suppressHydrationWarning>
      {/* Aplica el tema antes del render para evitar flash */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('theme');
            var p = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (t === 'dark' || (!t && p)) document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
