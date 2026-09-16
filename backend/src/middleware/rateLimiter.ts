import rateLimit from 'express-rate-limit';

// Limitador Geral da API (Protege contra sobrecarga da VPS)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requisições por IP por janela
  standardHeaders: true, // Retorna os cabeçalhos `RateLimit-*`
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições originadas deste IP. Tente novamente em alguns minutos.'
  }
});

// Limitador Estrito de Autenticação (Anti-Força Bruta e Proteção contra Proxy DDoS ao EduCampina)
// Impede que um invasor use o EduConnect para sobrecarregar a API do EduCampina com requisições de login
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo de 30 tentativas por IP em 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de autenticação. Por segurança, aguarde 15 minutos antes de tentar novamente.'
  }
});

// Limitador Específico para Uploads (Anti-Esgotamento de Disco)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40, // Máximo de 40 uploads por IP a cada 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de envio de arquivos atingido para este IP. Aguarde alguns minutos.'
  }
});
