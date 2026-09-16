import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';
import { logAuditEvent } from '../utils/audit.js';

const router = Router();

// Todas as rotas de auditoria exigem perfil ADMIN
router.use(authMiddleware, adminMiddleware);

// 1. Listagem Paginada de Logs com Filtros
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '30',
      category,
      status,
      action,
      schoolId,
      search,
      startDate,
      endDate
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category as string;
    }

    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (schoolId && schoolId !== 'ALL') {
      where.OR = [
        { schoolId: schoolId as string },
        { schoolName: { contains: schoolId as string, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        // Final do dia
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      const s = String(search).trim();
      where.OR = [
        ...(where.OR || []),
        { userName: { contains: s, mode: 'insensitive' } },
        { userEmail: { contains: s, mode: 'insensitive' } },
        { registration: { contains: s, mode: 'insensitive' } },
        { schoolName: { contains: s, mode: 'insensitive' } },
        { className: { contains: s, mode: 'insensitive' } },
        { action: { contains: s, mode: 'insensitive' } },
        { ipAddress: { contains: s, mode: 'insensitive' } },
        { details: { contains: s, mode: 'insensitive' } }
      ];
    }

    const [logs, total] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      (prisma as any).auditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ error: 'Erro interno ao consultar logs de auditoria' });
  }
});

// 2. Estatísticas Consolidadas de Auditoria
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      total,
      accessCount,
      postCount,
      moderationCount,
      failedCount,
      successCount,
      pendingCount,
      approvedCount,
      rejectedCount
    ] = await Promise.all([
      (prisma as any).auditLog.count(),
      (prisma as any).auditLog.count({ where: { category: 'ACESSO' } }),
      (prisma as any).auditLog.count({ where: { category: 'POSTAGEM' } }),
      (prisma as any).auditLog.count({ where: { category: 'MODERACAO' } }),
      (prisma as any).auditLog.count({ where: { status: 'FALHA' } }),
      (prisma as any).auditLog.count({ where: { status: 'SUCESSO' } }),
      (prisma as any).auditLog.count({ where: { status: 'PENDENTE' } }),
      (prisma as any).auditLog.count({ where: { status: 'APROVADO' } }),
      (prisma as any).auditLog.count({ where: { status: 'REPROVADO' } })
    ]);

    res.json({
      total,
      accessCount,
      postCount,
      moderationCount,
      failedCount,
      successCount,
      pendingCount,
      approvedCount,
      rejectedCount
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    res.status(500).json({ error: 'Erro ao gerar métricas de auditoria' });
  }
});

// 3. Exportação em CSV (Suporta 3 Meses, 6 Meses ou Completo)
router.get('/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = '3m', category, status } = req.query;

    const where: any = {};
    const now = new Date();

    if (period === '3m') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: threeMonthsAgo };
    } else if (period === '6m') {
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: sixMonthsAgo };
    }

    if (category && category !== 'ALL') {
      where.category = category as string;
    }
    if (status && status !== 'ALL') {
      where.status = status as string;
    }

    const logs = await (prisma as any).auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50000 // Limite de segurança por exportação
    });

    // Construção do CSV com escape seguro
    const csvHeader = [
      'ID',
      'Data/Hora',
      'Categoria',
      'Acao',
      'Status',
      'Usuario',
      'Papel',
      'Email',
      'Matricula',
      'Escola',
      'Turma',
      'IP',
      'Detalhes'
    ].join(';');

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '';
      const s = String(str).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
      return `"${s}"`;
    };

    const csvRows = logs.map((log: any) => [
      escapeCsv(log.id),
      escapeCsv(new Date(log.createdAt).toISOString()),
      escapeCsv(log.category),
      escapeCsv(log.action),
      escapeCsv(log.status),
      escapeCsv(log.userName),
      escapeCsv(log.userRole),
      escapeCsv(log.userEmail),
      escapeCsv(log.registration),
      escapeCsv(log.schoolName),
      escapeCsv(log.className),
      escapeCsv(log.ipAddress),
      escapeCsv(log.details)
    ].join(';'));

    const csvContent = '\uFEFF' + [csvHeader, ...csvRows].join('\r\n'); // \uFEFF adiciona BOM UTF-8 para Excel
    const filename = `auditoria_educonnect_${period}_${now.toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Erro ao exportar logs CSV:', error);
    res.status(500).json({ error: 'Erro ao gerar arquivo de exportação' });
  }
});

// 4. Expurgo Seguro de Logs Antigos (Liberação de Espaço na VPS)
router.delete('/purge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { olderThanMonths = '3' } = req.query;
    const months = parseInt(olderThanMonths as string, 10);

    if (isNaN(months) || months < 1) {
      throw new AppError('Período de expurgo inválido. Mínimo de 1 mês.', 400);
    }

    const now = new Date();
    const thresholdDate = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);

    // Contar quantos registros serão excluídos
    const eligibleCount = await (prisma as any).auditLog.count({
      where: {
        createdAt: { lt: thresholdDate }
      }
    });

    if (eligibleCount === 0) {
      return res.json({
        message: 'Nenhum log encontrado para o período selecionado.',
        deletedCount: 0,
        thresholdDate
      });
    }

    // Executar exclusão
    const result = await (prisma as any).auditLog.deleteMany({
      where: {
        createdAt: { lt: thresholdDate }
      }
    });

    // Registrar o próprio expurgo como evento de auditoria no sistema
    await logAuditEvent({
      action: 'LOGS_PURGED',
      category: 'SISTEMA',
      status: 'SUCESSO',
      userId: req.userId,
      userRole: req.userRole,
      details: {
        deletedCount: result.count,
        olderThanMonths: months,
        thresholdDate: thresholdDate.toISOString()
      }
    }, req);

    res.json({
      message: `Expurgo realizado com sucesso. ${result.count} registros foram removidos para liberar espaço no servidor.`,
      deletedCount: result.count,
      thresholdDate
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Erro ao expurgar logs:', error);
      res.status(500).json({ error: 'Erro interno ao realizar expurgo de logs' });
    }
  }
});

export default router;
