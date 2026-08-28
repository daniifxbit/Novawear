import express, { type NextFunction, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import { publicRouter } from './routes/public.js'
import { adminRouter } from './routes/admin.js'

/**
 * The Express application, with no listener attached: `index.ts` serves it as a
 * long-running process, and `api/index.ts` exports it as a Vercel function.
 */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use('/api', publicRouter)
  app.use('/api/admin', adminRouter)
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Route inconnue' })
  })

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (8 Mo maximum)' : 'Envoi de fichier refusé'
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

  return app
}
