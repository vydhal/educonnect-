import { Router, Response } from 'express';
import { prisma } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

const router = Router();

// Create post
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, image, images } = req.body;

    if (!content && (!images || images.length === 0) && !image) {
      throw new AppError('Content or image is required', 400);
    }

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Handle images array and legacy image field
    let imageList = images || [];
    if (image && !imageList.includes(image)) {
      imageList = [image, ...imageList];
    }

    const post = await prisma.post.create({
      data: {
        content: content || '', // Allow empty content if there are images
        image: imageList.length > 0 ? imageList[0] : null, // Backward compatibility
        images: imageList,
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true, school: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update post
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, images } = req.body;

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const post = await prisma.post.findUnique({
      where: { id: req.params.id }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== req.userId) {
      throw new AppError('Not authorized', 403);
    }

    // Handle images
    const imageList = images || post.images; // If not provided, keep existing? Or empty? Assuming update sends full state.
    // Ideally frontend sends the new desired state of images.

    const updatedPost = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        content: content !== undefined ? content : post.content,
        images: images !== undefined ? images : post.images,
        image: (images && images.length > 0) ? images[0] : (images !== undefined ? null : post.image) // Update legacy field
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true, school: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    res.json(updatedPost);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get all posts (feed)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true, school: true }
        },
        _count: {
          select: { comments: true, likes: true }
        },
        likes: req.userId ? {
          where: { userId: req.userId },
          select: { id: true, type: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedPosts = posts.map(post => ({
      ...post,
      likes: post._count.likes,
      comments: post._count.comments,
      liked: req.userId ? (post.likes as any)?.length > 0 : false,
      userReaction: req.userId ? (post.likes as any)?.[0]?.type || null : null
    }));

    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get post by id
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true }
            }
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    res.json(post);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Like post
router.post('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { type } = req.body; // LIKE, LOVE, CLAP, ROCKET, IDEA
    const reactionType = type || 'LIKE';

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: req.params.id,
          userId: req.userId
        }
      }
    });

    if (existingLike) {
      if (existingLike.type === reactionType) {
        // Same type: Toggle OFF
        await prisma.like.delete({
          where: { id: existingLike.id }
        });
        return res.json({ liked: false, type: null });
      } else {
        // Different type: Update
        await prisma.like.update({
          where: { id: existingLike.id },
          data: { type: reactionType }
        });
        return res.json({ liked: true, type: reactionType });
      }
    }

    // New Like
    await prisma.like.create({
      data: {
        postId: req.params.id,
        userId: req.userId,
        type: reactionType
      }
    });

    res.json({ liked: true, type: reactionType });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Add comment
router.post('/:id/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      throw new AppError('Comment content is required', 400);
    }

    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: req.params.id,
        authorId: req.userId
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      throw new AppError('Unauthorized', 401);
    }

    const post = await prisma.post.findUnique({
      where: { id: req.params.id }
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== req.userId && req.userRole !== 'ADMIN') {
      throw new AppError('Not authorized', 403);
    }

    await prisma.post.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
