import { Router } from 'express';
import { prisma } from '../prisma/client.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Public route to get all support items
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const items = await prisma.supportItem.findMany({
      orderBy: { order: 'asc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching support items:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de suporte' });
  }
});

// Admin ONLY routes
// Create new support item
router.post('/', [authMiddleware, adminMiddleware], async (req: any, res: any) => {
  try {
    const { type, title, content, link, order } = req.body;
    
    if (!['FAQ', 'TUTORIAL'].includes(type) || !title || !content) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const item = await prisma.supportItem.create({
      data: {
        type,
        title,
        content,
        link: link || null,
        order: order || 0,
      },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating support item:', error);
    res.status(500).json({ error: 'Erro ao criar item' });
  }
});

// Update support item
router.put('/:id', [authMiddleware, adminMiddleware], async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { type, title, content, link, order } = req.body;
    
    const item = await prisma.supportItem.update({
      where: { id },
      data: {
        type,
        title,
        content,
        link,
        order,
      },
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating support item:', error);
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// Delete support item
router.delete('/:id', [authMiddleware, adminMiddleware], async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.supportItem.delete({
      where: { id },
    });
    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    console.error('Error deleting support item:', error);
    res.status(500).json({ error: 'Erro ao deletar item' });
  }
});

export default router;
