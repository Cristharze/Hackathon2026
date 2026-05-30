import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcoTrack — Fundares',
  description: 'Dashboard de empresa aliada para gestión de reciclaje',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
