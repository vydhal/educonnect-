const express = require('express');
const prisma = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Verifica e cria marcos automáticos do sistema (10k logins, 36k estudantes, etc)
 */
async function checkSystemMilestones() {
    try {
        // 1. Verificação de 10.000 Logins
        const loginCount = await prisma.accessLog.count({ where: { type: 'LOGIN' } });
        if (loginCount >= 10000) {
            const existing = await prisma.milestone.findFirst({ where: { title: { contains: '10.000 Acessos' } } });
            if (!existing) {
                await prisma.milestone.create({
                    data: {
                        title: "🚀 Marca de 10.000 Acessos!",
                        message: "Incrível! Alcançamos a marca de 10.000 acessos no Portal EduCampina! Obrigado por fazer parte dessa jornada de transformação educacional. 🥳 À vocês, Gestores, Secretários e Professores, nossa gratidão! 🫶",
                        type: "celebration",
                        roles: ['ADMIN', 'MANAGER', 'SECRETARY', 'TEACHER', 'PEDAGOGICAL', 'COORDINATOR', 'SEDUC', 'SUPERVISOR', 'PEDAGOGICAL_ADVISOR', 'SOCIAL_WORKER', 'GUIDANCE_COUNSELOR', 'PSYCHOLOGIST', 'PEDAGOGICAL_SUPPORT'],
                        activeAt: new Date()
                    }
                });
            }
        }

        // 2. Verificação de 36.000 Estudantes
        const studentCount = await prisma.student.count({
            where: {
                isActive: true
            }
        });

        if (studentCount >= 36000) {
            const existing = await prisma.milestone.findFirst({ where: { title: { contains: '36.000 Estudantes' } } });
            if (!existing) {
                await prisma.milestone.create({
                    data: {
                        title: "🎉 36.000 Estudantes!",
                        message: "Uma marca histórica! Hoje o EduCampina orgulhosamente atende mais de 36.000 estudantes efetivados. Juntos, estamos construindo o futuro da educação! Parabéns a todos pela entrega e empatia! 🏫✨",
                        type: "celebration",
                        roles: ['ADMIN', 'MANAGER', 'SECRETARY', 'TEACHER', 'PEDAGOGICAL', 'COORDINATOR', 'SEDUC', 'SUPERVISOR', 'PEDAGOGICAL_ADVISOR', 'SOCIAL_WORKER', 'GUIDANCE_COUNSELOR', 'PSYCHOLOGIST', 'PEDAGOGICAL_SUPPORT'],
                        activeAt: new Date()
                    }
                });
            }
        }

        // 3. Verificação de 30.000 Logins
        if (loginCount >= 30000) {
            const existing = await prisma.milestone.findFirst({ where: { title: { contains: '30.000 Acessos' } } });
            if (!existing) {
                await prisma.milestone.create({
                    data: {
                        title: "🚀 Marca de 30.000 Acessos!",
                        message: "Uau! 30.000 vezes o Portal EduCampina foi a porta de entrada para a inovação! 🚀 Nossa rede está mais conectada do que nunca. Parabéns a todos por manterem a chama da educação acesa! 🔥✨",
                        type: "celebration",
                        roles: ['ADMIN', 'MANAGER', 'SECRETARY', 'TEACHER', 'PEDAGOGICAL', 'COORDINATOR', 'SEDUC', 'SUPERVISOR', 'PEDAGOGICAL_ADVISOR', 'SOCIAL_WORKER', 'GUIDANCE_COUNSELOR', 'PSYCHOLOGIST', 'PEDAGOGICAL_SUPPORT'],
                        activeAt: new Date()
                    }
                });
            }
        }

        // 4. Verificação de Turmas e Estudantes AEE
        const aeeClassCount = await prisma.class.count({ where: { category: 'AEE', isActive: true } });
        const aeeStudentCount = await prisma.aeeEnrollment.count();

        if (aeeClassCount >= 100 && aeeStudentCount >= 1000) {
            const existing = await prisma.milestone.findFirst({ where: { title: { contains: 'AEE: 100 Turmas' } } });
            if (!existing) {
                await prisma.milestone.create({
                    data: {
                        title: "🧩🧩 AEE: 100 Turmas e 1.000 Estudantes!",
                        message: "Inclusão é a nossa marca! 💙 Ultrapassamos 100 turmas de AEE e mais de 1.000 corações atendidos com dedicação e carinho especial. A educação inclusiva de Campina Grande é referência graças a vocês! 🏫🌻",
                        type: "celebration",
                        roles: ['ADMIN', 'MANAGER', 'SECRETARY', 'TEACHER', 'PEDAGOGICAL', 'COORDINATOR', 'SEDUC', 'SUPERVISOR', 'PEDAGOGICAL_ADVISOR', 'SOCIAL_WORKER', 'GUIDANCE_COUNSELOR', 'PSYCHOLOGIST', 'PEDAGOGICAL_SUPPORT'],
                        activeAt: new Date()
                    }
                });
            }
        }

        // 5. Verificação de Registros de Diário
        const diaryCount = await prisma.classDiary.count();
        if (diaryCount >= 100000) {
            const existing = await prisma.milestone.findFirst({ where: { title: { contains: '100.000 Registros de Diário' } } });
            if (!existing) {
                await prisma.milestone.create({
                    data: {
                        title: "📝 100.000 Registros de Diário!",
                        message: "Compromisso que se registra! 📝 Já temos mais de 100.000 registros de diário de classe realizados. Professores, seu empenho e responsabilidade com o futuro de Campina Grande e nossos estudantes são admiráveis! Obrigado por cada lição registrada! 🎓🙏",
                        type: "celebration",
                        roles: ['ADMIN', 'MANAGER', 'SECRETARY', 'TEACHER', 'PEDAGOGICAL', 'COORDINATOR', 'SEDUC', 'SUPERVISOR', 'PEDAGOGICAL_ADVISOR', 'SOCIAL_WORKER', 'GUIDANCE_COUNSELOR', 'PSYCHOLOGIST', 'PEDAGOGICAL_SUPPORT'],
                        activeAt: new Date()
                    }
                });
            }
        }

        // 6. Verificação de Bimesteres (Pode ser manual ou baseada em data)
        // Por enquanto, essas marcas podem ser criadas via Admin, mas aqui as automatizamos se necessário.

    } catch (error) {
        console.error('Error checking system milestones:', error);
    }
}

// @route   GET /api/milestones
// @desc    Obter marcos pendentes para o usuário atual
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = req.user;

        // Rodar verificação de sistema antes de buscar os pendentes
        await checkSystemMilestones();

        // Buscar marcos que:
        // 1. Foram criados APÓS o usuário ter sido cadastrado
        // 2. São destinados ao papel (role) do usuário
        // 3. O usuário ainda não visualizou
        // 4. Já estão liberados (activeAt <= agora)
        const milestones = await prisma.milestone.findMany({
            where: {
                createdAt: {
                    gt: user.createdAt
                },
                activeAt: {
                    lte: new Date()
                },
                roles: {
                    has: user.role
                },
                seenBy: {
                    none: {
                        userId: user.id
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.json({
            success: true,
            data: milestones
        });
    } catch (error) {
        console.error('Get milestones error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar marcos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/milestones/:id/read
// @desc    Marcar um marco como visualizado
// @access  Private
router.post('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await prisma.userMilestone.upsert({
            where: {
                userId_milestoneId: {
                    userId,
                    milestoneId: id
                }
            },
            update: {},
            create: {
                userId,
                milestoneId: id
            }
        });

        res.json({
            success: true,
            message: 'Marco marcado como lido'
        });
    } catch (error) {
        console.error('Mark milestone as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar marco como lido',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Admin Routes
// @route   GET /api/milestones/all
// @desc    Obter todos os marcos cadastrados (Admin)
// @access  Private (Admin)
router.get('/all', auth, async (req, res) => {
    try {
        console.log([MILESTONES] GET / all requested by ${ req.user.id }(Role: ${ req.user.role }));

        if (req.user.role !== 'ADMIN') {
            console.warn([MILESTONES] Forbidden access to / all for role ${ req.user.role });
            return res.status(403).json({ success: false, message: 'Acesso negado' });
        }

        const milestones = await prisma.milestone.findMany({
            orderBy: { createdAt: 'desc' }
        });

        console.log([MILESTONES] Returning ${ milestones.length } milestones);
        res.json({ success: true, data: milestones });
    } catch (error) {
        console.error('Get all milestones error:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar marcos' });
    }
});

// @route   POST /api/milestones
// @desc    Criar novo marco (Admin)
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    try {
        console.log([MILESTONES] POST / requested by ${ req.user.id }(Role: ${ req.user.role }));
        console.log('[MILESTONES] Body:', req.body);

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Acesso negado' });
        }

        const { title, message, roles, activeAt } = req.body;

        if (!title || !message || !roles) {
            return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes' });
        }

        const milestone = await prisma.milestone.create({
            data: {
                title,
                message,
                roles,
                activeAt: activeAt ? new Date(activeAt) : new Date()
            }
        });

        console.log([MILESTONES] Created milestone ${ milestone.id });
        res.json({ success: true, data: milestone });
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ success: false, message: 'Erro ao criar marco' });
    }
});

// @route   DELETE /api/milestones/:id
// @desc    Excluir um marco (Admin)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Acesso negado' });
        }

        const { id } = req.params;

        // Delete associated user relations first
        await prisma.userMilestone.deleteMany({
            where: { milestoneId: id }
        });

        await prisma.milestone.delete({
            where: { id: id }
        });

        res.json({ success: true, message: 'Marco excluído com sucesso' });
    } catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({ success: false, message: 'Erro ao excluir marco' });
    }
});

module.exports = router;