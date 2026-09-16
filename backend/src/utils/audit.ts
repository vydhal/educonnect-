import { Request } from 'express';
import { prisma } from '../prisma/client.js';

export interface AuditLogData {
  action: string;
  category: 'ACESSO' | 'POSTAGEM' | 'MODERACAO' | 'SISTEMA' | 'USUARIO';
  status: 'SUCESSO' | 'FALHA' | 'PENDENTE' | 'APROVADO' | 'REPROVADO';
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  userEmail?: string | null;
  registration?: string | null;
  classId?: string | null;
  className?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | string | null;
  targetId?: string | null;
  targetType?: string | null;
}

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
};

export const logAuditEvent = async (data: AuditLogData, req?: Request): Promise<void> => {
  try {
    const ip = req ? getClientIp(req) : data.ipAddress || null;
    const ua = req ? (req.headers['user-agent'] || null) : data.userAgent || null;

    let detailsString: string | null = null;
    if (data.details) {
      detailsString = typeof data.details === 'string' ? data.details : JSON.stringify(data.details);
    }

    await (prisma as any).auditLog.create({
      data: {
        action: data.action,
        category: data.category,
        status: data.status,
        userId: data.userId || null,
        userName: data.userName || null,
        userRole: data.userRole || null,
        userEmail: data.userEmail || null,
        registration: data.registration || null,
        classId: data.classId || null,
        className: data.className || null,
        schoolId: data.schoolId || null,
        schoolName: data.schoolName || null,
        ipAddress: ip,
        userAgent: ua,
        details: detailsString,
        targetId: data.targetId || null,
        targetType: data.targetType || null
      }
    });
  } catch (error) {
    // Fail-safe: falha no log de auditoria não aborta a requisição do usuário
    console.error('Falha ao registrar log de auditoria:', error);
  }
};
