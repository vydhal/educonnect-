import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.project.deleteMany();
  await prisma.moderationItem.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@educonnect.com',
      password: await hashPassword('admin123'),
      name: 'Admin EduConnect',
      role: 'ADMIN',
      verified: true,
      bio: 'Administrador da plataforma EduConnect',
      avatar: 'https://i.pravatar.cc/150?u=admin@educonnect.com'
    }
  });

  const professor = await prisma.user.create({
    data: {
      email: 'prof.carlos@educonnect.com',
      password: await hashPassword('prof123'),
      name: 'Prof. Carlos Almeida',
      role: 'PROFESSOR',
      verified: true,
      school: 'EMEF Raul Córdula',
      bio: 'Professor de História e Ciências',
      avatar: 'https://i.pravatar.cc/150?u=carlos@educonnect.com'
    }
  });

  const professor2 = await prisma.user.create({
    data: {
      email: 'prof.maria@educonnect.com',
      password: await hashPassword('prof123'),
      name: 'Profa. Maria Silva',
      role: 'PROFESSOR',
      verified: true,
      school: 'Escola Municipal Tiradentes',
      bio: 'Professora de Matemática',
      avatar: 'https://i.pravatar.cc/150?u=maria@educonnect.com'
    }
  });

  const aluno = await prisma.user.create({
    data: {
      email: 'joao@educonnect.com',
      password: await hashPassword('aluno123'),
      name: 'João Santos',
      role: 'ALUNO',
      verified: false,
      school: 'EMEF Raul Córdula',
      bio: 'Aluno do 9º ano',
      avatar: 'https://i.pravatar.cc/150?u=joao@educonnect.com'
    }
  });

  const aluno2 = await prisma.user.create({
    data: {
      email: 'julia@educonnect.com',
      password: await hashPassword('aluno123'),
      name: 'Júlia Costa',
      role: 'ALUNO',
      verified: false,
      school: 'Escola Municipal Tiradentes',
      bio: 'Aluna do 8º ano',
      avatar: 'https://i.pravatar.cc/150?u=julia@educonnect.com'
    }
  });

  const escola = await prisma.user.create({
    data: {
      email: 'raul.cordula@educonnect.com',
      password: await hashPassword('escola123'),
      name: 'EMEF Raul Córdula',
      role: 'ESCOLA',
      verified: true,
      bio: 'Escola Municipal - Campina Grande',
      avatar: 'https://i.pravatar.cc/150?u=raul@educonnect.com'
    }
  });

  console.log('✅ Users created');

  // Create follows
  await prisma.userFollow.createMany({
    data: [
      { followerId: professor.id, followingId: professor2.id },
      { followerId: aluno.id, followingId: professor.id },
      { followerId: aluno2.id, followingId: professor.id },
      { followerId: aluno.id, followingId: aluno2.id }
    ]
  });

  console.log('✅ Follows created');

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      content: 'Hoje iniciamos a fase de colheita do nosso Projeto Horta Escolar. Os alunos do 6º ano aplicaram conhecimentos de biologia e sustentabilidade na prática. 🌱🥦',
      image: 'https://images.unsplash.com/photo-1574528159913-04c1eaa68f13?w=600',
      authorId: escola.id
    }
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Trabalho incrível feito pela turma do 9º ano sobre a Revolução Industrial com maquetes em 3D. Orgulho dessa dedicação!',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      authorId: professor.id
    }
  });

  const post3 = await prisma.post.create({
    data: {
      content: 'Confira os resultados da Feira de Ciências da nossa escola! Parabéns a todos os participantes que apresentaram projetos incríveis sobre energias renováveis.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600',
      authorId: escola.id
    }
  });

  const post4 = await prisma.post.create({
    data: {
      content: 'Dica: A melhor forma de aprender matemática é praticando! Está com dúvida em equações do 2º grau? Deixa um comentário aqui! 📐✏️',
      authorId: professor2.id
    }
  });

  const post5 = await prisma.post.create({
    data: {
      content: 'Que privilégio participar desta aula prática de química! Amei entender como funciona a reação de neutralização. Obrigado Prof. Carlos! 🧪',
      authorId: aluno.id
    }
  });

  console.log('✅ Posts created');

  // Create likes
  await prisma.like.createMany({
    data: [
      { postId: post1.id, userId: professor.id },
      { postId: post1.id, userId: aluno.id },
      { postId: post1.id, userId: aluno2.id },
      { postId: post2.id, userId: aluno.id },
      { postId: post2.id, userId: professor2.id },
      { postId: post3.id, userId: professor.id },
      { postId: post3.id, userId: professor2.id },
      { postId: post4.id, userId: aluno.id },
      { postId: post5.id, userId: professor.id }
    ]
  });

  console.log('✅ Likes created');

  // Create comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Que legal! Os alunos estão adorando o projeto! 👏',
        postId: post1.id,
        authorId: professor.id
      },
      {
        content: 'Queremos mais projetos assim!',
        postId: post1.id,
        authorId: aluno.id
      },
      {
        content: 'Muito bom mesmo! Parabéns a todos!',
        postId: post2.id,
        authorId: professor2.id
      },
      {
        content: 'Adorei a apresentação! Muito criativo! 🎨',
        postId: post3.id,
        authorId: aluno2.id
      }
    ]
  });

  console.log('✅ Comments created');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      title: 'Horta Escolar Sustentável',
      description: 'Projeto de criação de uma horta orgânica na escola, promovendo educação ambiental e produção de alimentos saudáveis.',
      content: '<p>Nossa horta escolar é um projeto interdiciplinar que envolve alunos do 6º ao 9º ano...</p>',
      etapa: 'ANOS_FINAIS',
      componente: 'Ciências',
      category: 'Sustentabilidade',
      image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=600',
      authorId: escola.id
    }
  });

  const project2 = await prisma.project.create({
    data: {
      title: 'Ciência em 3D',
      description: 'Utilização de impressoras 3D para criar modelos científicos interativos e facilitar o aprendizado de conceitos complexos.',
      content: '<h2>Aprendizado Imersivo</h2><p>Com o uso da tecnologia 3D, transformamos a sala de aula em um laboratório de inovação.</p>',
      etapa: 'ANOS_INICIAIS',
      componente: 'Matemática',
      category: 'Tecnologia',
      image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600',
      authorId: professor.id
    }
  });

  const project3 = await prisma.project.create({
    data: {
      title: 'Clube de Programação',
      description: 'Clube onde alunos aprendem linguagens de programação e desenvolvem aplicativos reais para resolver problemas da comunidade.',
      content: '<h3>Código para Todos</h3><p>O clube de programação visa democratizar o acesso à tecnologia e lógica de programação.</p>',
      etapa: 'ANOS_FINAIS',
      componente: 'Matemática',
      category: 'Programação',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      authorId: professor2.id
    }
  });

  console.log('✅ Projects created');

  console.log('✨ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
