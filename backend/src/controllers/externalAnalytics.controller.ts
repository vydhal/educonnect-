import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';

export const getEngagementAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'all', schoolId } = req.query;

    // 1. Definição da janela de tempo
    let dateFilter: { gte?: Date } = {};
    const now = new Date();
    if (period === '7d') {
      dateFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === '30d') {
      dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    }

    // 2. Filtro de escola para usuários
    const userSchoolWhere: any = {};
    if (schoolId && typeof schoolId === 'string' && schoolId.trim() !== '' && schoolId !== 'all') {
      const cleanSchoolId = schoolId.trim();
      userSchoolWhere.OR = [
        { schoolId: cleanSchoolId },
        { school: { contains: cleanSchoolId, mode: 'insensitive' } },
        { memberOfSchools: { some: { id: cleanSchoolId } } }
      ];
    }

    // 3. Totais gerais no período
    const postCreatedAt = dateFilter.gte ? { createdAt: dateFilter } : {};
    const commentCreatedAt = dateFilter.gte ? { createdAt: dateFilter } : {};
    const likeCreatedAt = dateFilter.gte ? { createdAt: dateFilter } : {};
    const projectCreatedAt = dateFilter.gte ? { createdAt: dateFilter } : {};

    const [totalPosts, totalComments, totalLikes, totalProjects] = await Promise.all([
      prisma.post.count({
        where: {
          ...postCreatedAt,
          ...(schoolId && schoolId !== 'all' ? { author: userSchoolWhere } : {})
        }
      }),
      prisma.comment.count({
        where: {
          ...commentCreatedAt,
          ...(schoolId && schoolId !== 'all' ? { author: userSchoolWhere } : {})
        }
      }),
      prisma.like.count({
        where: {
          ...likeCreatedAt,
          ...(schoolId && schoolId !== 'all' ? { user: userSchoolWhere } : {})
        }
      }),
      prisma.project.count({
        where: {
          ...projectCreatedAt,
          ...(schoolId && schoolId !== 'all' ? { author: userSchoolWhere } : {})
        }
      })
    ]);

    const totalInteractions = totalPosts + totalComments + totalLikes;

    // 4. Buscar usuários com contadores de interações
    const users = await prisma.user.findMany({
      where: {
        ...userSchoolWhere
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        school: true,
        registration: true,
        className: true,
        updatedAt: true,
        _count: {
          select: {
            posts: { where: postCreatedAt },
            comments: { where: commentCreatedAt },
            likes: { where: likeCreatedAt },
            projects: { where: projectCreatedAt }
          }
        }
      }
    });

    // 5. Mapear e calcular pontuação ponderada de engajamento
    // Pesos: Projeto = 15 pts, Post = 10 pts, Comentário = 5 pts, Curtida = 2 pts
    const mappedUsers = users.map(u => {
      const postsCount = u._count.posts;
      const commentsCount = u._count.comments;
      const likesCount = u._count.likes;
      const projectsCount = u._count.projects;
      const totalScore = (projectsCount * 15) + (postsCount * 10) + (commentsCount * 5) + (likesCount * 2);

      return {
        id: u.id,
        name: u.name,
        // Proteção LGPD: e-mail de alunos é nulo para o painel externo
        email: u.role === 'ALUNO' ? null : u.email,
        role: u.role,
        avatarUrl: u.avatar || null,
        school: u.school || '',
        registration: u.registration || null,
        className: u.className || null,
        postsCount,
        commentsCount,
        likesCount,
        projectsCount,
        totalScore,
        lastActiveAt: u.updatedAt
      };
    });

    // 6. Filtrar usuários ativos no período (score > 0)
    const activeUsers = mappedUsers.filter(u => u.totalScore > 0);

    // Contadores de usuários ativos por papel
    const activeStudents = activeUsers.filter(u => u.role === 'ALUNO').length;
    const activeTeachers = activeUsers.filter(u => u.role === 'PROFESSOR').length;

    // 7. Rankings Ordenados
    const topStudents = activeUsers
      .filter(u => u.role === 'ALUNO')
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    const topTeachers = activeUsers
      .filter(u => u.role === 'PROFESSOR')
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    const topUsers = [...activeUsers]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 15);

    res.json({
      period,
      schoolId: schoolId || null,
      summary: {
        totalInteractions,
        activeStudents,
        activeTeachers,
        totalPosts,
        totalComments,
        totalLikes,
        totalProjects
      },
      topStudents,
      topTeachers,
      topUsers
    });
  } catch (error) {
    console.error('Erro ao gerar métricas de engajamento para o EduCampina:', error);
    res.status(500).json({ error: 'Erro interno ao processar analytics' });
  }
};
