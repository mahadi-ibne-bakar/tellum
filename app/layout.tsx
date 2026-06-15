import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Tellum',
  description: 'AI-powered Rock Paper Scissors that reads your opponent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}