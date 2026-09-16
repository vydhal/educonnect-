import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const providedKey = req.headers['x-api-key'] as string;
  const configuredKey = process.env.EDUCONNECT_API_KEY || process.env.PORTAL_API_KEY;

  if (!configuredKey) {
    console.error('ERRO: Nem EDUCONNECT_API_KEY nem PORTAL_API_KEY estão definidos nas variáveis de ambiente');
    res.status(500).json({ error: 'Chave de API do servidor não configurada' });
    return;
  }

  if (!providedKey) {
    res.status(401).json({ error: 'Cabeçalho x-api-key ausente' });
    return;
  }

  // Comparação segura de tamanho e conteúdo
  const providedBuffer = Buffer.from(providedKey);
  const configuredBuffer = Buffer.from(configuredKey);

  if (
    providedBuffer.length !== configuredBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, configuredBuffer)
  ) {
    res.status(403).json({ error: 'Chave de API inválida' });
    return;
  }

  next();
};
