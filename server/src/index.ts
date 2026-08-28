import fs from 'node:fs'
import path from 'node:path'
import express, { type NextFunction, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import { PRODUCT_IMG_DIR } from './db.js'
import { seed } from './seed.js'
import { publicRouter } from './routes/public.js'
import { adminRouter } from './routes/admin.js'
import { IS_DEMO_CODE } from './auth.js'
import { mailIsLive } from './mailer.js'

const PORT = Number(process.env.PORT ?? 4000)
const WEB_DIST = path.resolve(process.cwd(), '../web/dist')

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Product photos uploaded from the back-office are public catalogue content.
app.use('/api/media/products', express.static(PRODUCT_IMG_DIR, { maxAge: '7d', index: false }))

app.use('/api', publicRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// In production the built front-end is served from the same origin.
if (fs.existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, { index: false }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(path.join(WEB_DIST, 'index.html'))
  })
}

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Route inconnue' })
    return
  }
  res.status(404).send('Not found')
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (8 Mo maximum)' : 'Envoi de fichier refusé'
    res.status(400).json({ error: message })
    return
  }
  if (err instanceof Error && err.message === 'Format de fichier non accepté') {
    res.status(400).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Erreur serveur' })
})

const { inserted } = seed()
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
