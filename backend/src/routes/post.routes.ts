import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
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

    // Extract hashtags
    const tags = content ? (content.match(/#[\w\u00C0-\u00FF]+/g) || []).map((tag: string) => tag.substring(1)) : [];

    // Fetch author to get schoolId
    const author = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { schoolId: true }
    });

    const post = await prisma.post.create({
      data: {
        content: content || '', // Allow empty content if there are images
        image: imageList.length > 0 ? imageList[0] : null, // Backward compatibility
        images: imageList,
        authorId: req.userId,
        schoolId: author?.schoolId,
        tags
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

    // Create MENTION notifications for @[Name](id) patterns
    if (content) {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      const mentionedIds = new Set<string>();
      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedId = match[2];
        if (mentionedId !== req.userId && !mentionedIds.has(mentionedId)) {
          mentionedIds.add(mentionedId);
          prisma.notification.create({
            data: {
              type: 'MENTION',
              recipientId: mentionedId,
              senderId: req.userId,
              relatedId: post.id,
              content: 'te mencionou em uma publicação'
            }
          }).catch((err: any) => console.error('Failed to create mention notification', err));
        }
      }
    }

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

    // Extract hashtags if content is updated
    let tags = post.tags;
    if (content !== undefined) {
      tags = (content.match(/#[\w\u00C0-\u00FF]+/g) || []).map((tag: string) => tag.substring(1));
    }

    const updatedPost = await prisma.post.update({
      where: { id: req.params.id },
      data: {
        content: content !== undefined ? content : post.content,
        images: images !== undefined ? images : post.images,
        image: (images && images.length > 0) ? images[0] : (images !== undefined ? null : post.image), // Update legacy field
        tags
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
    const { tag, search } = req.query;
    const where: any = {};

    if (tag) {
      where.tags = { has: tag as string };
    }

    if (search) {
      where.OR = [
        { content: { contains: search as string, mode: 'insensitive' } },
        { author: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true, verified: true, school: true }
        },
        _count: {
          select: { comments: true, likes: true }
        },
        comments: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true, role: true, verified: true }
            }
          }
        },
        likes: req.userId ? {
          where: { userId: req.userId },
          select: { id: true, type: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      likes: post._count.likes,
      commentsCount: post._count.comments,
      comments: post.comments,
      liked: req.userId ? (post.likes as any)?.length > 0 : false,
      userReaction: req.userId ? (post.likes as any)?.[0]?.type || null : null
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
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
    const like = await prisma.like.create({
      data: {
        postId: req.params.id,
        userId: req.userId,
        type: reactionType
      }
    });

    // Notify post author if not liking own post
    const postForLike = await prisma.post.findUnique({ where: { id: req.params.id }, select: { authorId: true } });
    if (postForLike && postForLike.authorId !== req.userId) {
      await prisma.notification.create({
        data: {
          type: 'POST_LIKE',
          recipientId: postForLike.authorId,
          senderId: req.userId,
          relatedId: req.params.id,
          content: `curtiu sua publicação`
        }
      }).catch((err: any) => console.error('Failed to create like notification', err));
    }

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

    // Notify post author if not commenting on own post
    const postForComment = await prisma.post.findUnique({ where: { id: req.params.id }, select: { authorId: true } });
    if (postForComment && postForComment.authorId !== req.userId) {
      await prisma.notification.create({
        data: {
          type: 'POST_COMMENT',
          recipientId: postForComment.authorId,
          senderId: req.userId,
          relatedId: req.params.id,
          content: `comentou na sua publicação: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`
        }
      }).catch((err: any) => console.error('Failed to create comment notification', err));
    }

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

// Update comment
router.put('/:postId/comments/:commentId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    const { commentId } = req.params;

    if (!content) {
      throw new AppError('Content is required', 400);
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== req.userId) {
      throw new AppError('Unauthorized', 403);
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete comment
router.delete('/:postId/comments/:commentId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Author of comment or admin can delete
    if (comment.authorId !== req.userId && req.userRole !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
