import { Router, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { hashPassword, generateToken, comparePassword } from '../utils/auth.js';
import { AuthenticatedRequest, AppError } from '../middleware/errorHandler.js';

import { authMiddleware } from '../middleware/auth.js';
import { validateSSOToken, verifyPortalCredentials, verifyStudentCredentials, mapPortalRole, getOrCreateSchool, PortalUser } from '../utils/portal.js';

const router = Router();

// ... existing code ...

// Register
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role, schoolId } = req.body;

    if (!email || !password || !name || !role) {
      throw new AppError('Missing required fields', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        schoolId
      }
    });

    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('GET /profile called for user:', req.userId);
    if (!req.userId) {
      console.log('GET /profile: No userId in request');
      throw new AppError('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        memberOfSchools: { select: { id: true, name: true } },
        _count: {
          select: { followers: true, following: true, posts: true }
        }
      }
    });

    if (!user) {
      console.log('GET /profile: User not found in DB');
      throw new AppError('User not found', 404);
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      school: user.school,
      schools: user.memberOfSchools,
      registration: user.registration,
      classId: user.classId,
      className: user.className,
      verified: user.verified,
      stats: user._count
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// External Portal Manual Verify
router.post('/external/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400);
    }

    const portalUser = await verifyPortalCredentials(email, password);
    if (!portalUser) {
      throw new AppError('Credenciais inválidas no Portal', 401);
    }

    // Process Login/JIT using shared logic
    const result = await processExternalLogin(portalUser);
    res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// External Portal SSO Callback (Proxy from frontend)
router.post('/external/sso', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token is required', 400);
    }

    const portalUser = validateSSOToken(token);
    if (!portalUser) {
      throw new AppError('Token SSO inválido ou expirado', 401);
    }

    // Process Login/JIT using shared logic
    const result = await processExternalLogin(portalUser);
    res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Student Direct Login (Matrícula + Código de Acesso da Turma)
router.post('/student-login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { registration, accessCode } = req.body;

    if (!registration || !accessCode) {
      throw new AppError('Matrícula e código da turma são obrigatórios', 400);
    }

    const studentData = await verifyStudentCredentials(registration, accessCode);
    if (!studentData) {
      throw new AppError('Matrícula ou código da turma inválido', 401);
    }

    const portalUser: PortalUser = {
      email: studentData.email,
      name: studentData.name,
      role: 'ALUNO',
      registration: studentData.registration,
      classId: studentData.class?.id,
      className: studentData.class?.name,
      schoolName: studentData.school?.name,
      schools: studentData.school ? [studentData.school] : []
    };

    const result = await processExternalLogin(portalUser);
    res.json(result);
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message || 'Falha ao autenticar estudante' });
    }
  }
});

/**
 * Shared logic for JIT provisioning and SSO login
 */
async function processExternalLogin(portalUser: PortalUser) {
  const { email, name, role, schoolName, schools, registration, classId, className } = portalUser;

  // Locate user by registration (if provided) or by email
  let user = null;
  if (registration) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { registration },
          { email }
        ]
      }
    });
  } else {
    user = await prisma.user.findUnique({ where: { email } });
  }

  // Handle both legacy schoolName (string) and new schools (array of objects)
  const incomingSchools = [
    ...(schoolName ? [{ name: schoolName } as any] : []),
    ...(schools || [])
  ];

  // Deduplicate by INEP (if available) or Name
  const seen = new Set<string>();
  const schoolsToProcess = incomingSchools.filter(s => {
    const key = (s.inep || s.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Find or Create all school units
  const schoolRecords = await Promise.all(
    schoolsToProcess.map(s => getOrCreateSchool(s))
  );
  const validSchoolIds = schoolRecords.map(s => s?.id).filter((id): id is string => !!id);
  const primarySchoolName = schoolRecords[0]?.name || null;

  // JIT Provisioning
  if (!user) {
    const mappedRole = mapPortalRole(role);
    const hashedPassword = await hashPassword('EXTERNAL_SSO_' + Math.random().toString(36).substring(7));

    user = await prisma.user.create({
      data: {
        email,
        name,
        role: mappedRole,
        registration: registration || null,
        classId: classId || null,
        className: className || null,
        password: hashedPassword,
        school: primarySchoolName, // Primary school string
        schoolId: validSchoolIds[0] || null,  // Primary school ID
        verified: true,
        memberOfSchools: {
          connect: validSchoolIds.map(id => ({ id }))
        }
      }
    });
  } else {
    // Update existing user with new school links and potentially new Role/Class
    const mappedRole = mapPortalRole(role);
    
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: mappedRole,
        registration: registration || user.registration || null,
        classId: classId !== undefined ? classId : user.classId,
        className: className !== undefined ? className : user.className,
        schoolId: user.schoolId || validSchoolIds[0] || null,
        school: user.school || primarySchoolName,
        memberOfSchools: {
          set: validSchoolIds.map(id => ({ id })) // Sync with current Portal list
        }
      }
    });
  }

  const token = generateToken(user.id, user.role);

  return {
    message: 'Login realizado com sucesso',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      registration: user.registration,
      classId: user.classId,
      className: user.className,
      school: user.school
    }
  };
}

export default router;
