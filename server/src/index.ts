import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createApp } from './app.js'
import { seed } from './seed.js'
import { IS_DEMO_CODE } from './auth.js'
import { mailIsLive } from './mailer.js'

const PORT = Number(process.env.PORT ?? 4000)
const WEB_DIST = path.resolve(process.cwd(), '../web/dist')

const app = createApp()

// Running as a single process: also serve the built front-end from this origin.
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, { index: false }))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(WEB_DIST, 'index.html'))
  })
}

const { inserted } = await seed()
if (inserted) console.log(`Catalogue initialisé — ${inserted} articles.`)
if (IS_DEMO_CODE) {
  console.warn('⚠  ADMIN_CODE non défini : le code de démonstration « NOVA » est actif.')
}
if (!process.env.SESSION_SECRET) {
  console.warn('⚠  SESSION_SECRET non défini : les sessions admin seront invalidées à chaque redémarrage.')
}
if (!mailIsLive) {
  console.warn('⚠  Aucun SMTP configuré : les emails sont écrits dans data/outbox au lieu d’être envoyés.')
}

app.listen(PORT, () => {
  console.log(`NOVAWEAR API — http://localhost:${PORT}`)
})
