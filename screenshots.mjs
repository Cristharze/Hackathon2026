import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const OUT  = 'C:/Users/usuario/Desktop/Hackathon2026/screenshots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page    = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

const pages = [
  { url: '/admin/validacion', name: '1-validacion' },
  { url: '/admin/dashboard',  name: '2-dashboard'  },
  { url: '/admin/empresas',   name: '3-empresas'   },
]

for (const { url, name } of pages) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`✓ ${name}.png`)
}

await browser.close()
