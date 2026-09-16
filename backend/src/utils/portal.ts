import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../prisma/client.js';

const PORTAL_API_URL = process.env.PORTAL_API_URL;
const PORTAL_API_KEY = process.env.PORTAL_API_KEY;
const SOCIAL_SSO_SECRET = process.env.SOCIAL_SSO_SECRET;

export interface PortalSchool {
  id: string;
  name: string;
  inep?: string;
  address?: string;
  zone?: string;
  schoolType?: string;
}

export interface PortalUser {
  email: string;
  name: string;
  role: string;
  schoolName?: string;
  schools?: PortalSchool[];
  registration?: string;
  classId?: string;
  className?: string;
}

const ROLE_MAP: Record<string, string> = {
  'ADMIN': 'ADMIN',
  'TEACHER': 'PROFESSOR',
  'STUDENT': 'ALUNO',
  'SEDUC': 'SEDUC',
  'SECRETARY': 'EQUIPE_ESCOLAR',
  'MANAGER': 'EQUIPE_ESCOLAR',
  'COORDINATOR': 'EQUIPE_ESCOLAR',
  'PEDAGOGICAL': 'EQUIPE_ESCOLAR',
  'SUPERVISOR': 'EQUIPE_ESCOLAR',
  'DIRECTOR': 'EQUIPE_ESCOLAR',
  'PEDAGOG_COORDINATOR': 'EQUIPE_ESCOLAR',
  'PEDAGOGICAL_SUPPORT': 'EQUIPE_ESCOLAR',
  'PSYCHOLOGIST': 'EQUIPE_ESCOLAR',
  'SOCIAL_WORKER': 'EQUIPE_ESCOLAR',
  'GUIDANCE_COUNSELOR': 'EQUIPE_ESCOLAR',
  'PEDAGOGICAL_ADVISOR': 'EQUIPE_ESCOLAR',
  'EQUIPE_ESCOLAR': 'EQUIPE_ESCOLAR',
};

export const mapPortalRole = (portalRole: string): string => {
  return ROLE_MAP[portalRole] || portalRole || 'ALUNO';
};

export const validateSSOToken = (token: string): PortalUser | null => {
  try {
    if (!SOCIAL_SSO_SECRET) {
      console.error('SOCIAL_SSO_SECRET not configured');
      return null;
    }
    const decoded = jwt.verify(token, SOCIAL_SSO_SECRET) as PortalUser;
    return decoded;
  } catch (error) {
    console.error('Invalid SSO Token:', error);
    return null;
  }
};

export const verifyPortalCredentials = async (email: string, password: string): Promise<PortalUser | null> => {
  try {
    if (!PORTAL_API_URL || !PORTAL_API_KEY) {
      console.error('Portal API configuration missing');
      return null;
    }

    const response = await axios.post(`${PORTAL_API_URL}/api/auth/external/verify`, {
      email,
      password,
      apiKey: PORTAL_API_KEY
    }, {
      timeout: 5000 // 5s timeout de proteção contra socket hang / negação de serviço
    });

    if (response.data.success) {
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error('Error verifying portal credentials:', error);
    return null;
  }
};

export interface StudentVerifyData {
  registration: string;
  name: string;
  email: string;
  role: string;
  school: {
    id: string;
    name: string;
    inep?: string;
    address?: string;
    zone?: string;
  };
  class: {
    id: string;
    name: string;
    grade?: string;
  };
}

export const verifyStudentCredentials = async (registration: string, accessCode: string): Promise<StudentVerifyData | null> => {
  try {
    if (!PORTAL_API_URL || !PORTAL_API_KEY) {
      console.error('Portal API configuration missing');
      return null;
    }

    const response = await axios.post(`${PORTAL_API_URL}/api/auth/external/student-verify`, {
      registration,
      accessCode,
      apiKey: PORTAL_API_KEY
    }, {
      timeout: 5000 // 5s timeout de proteção contra socket hang / negação de serviço
    });

    if (response.data.success && response.data.student) {
      return response.data.student;
    }
    return null;
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error.message;
    console.error('Error verifying student credentials:', errorMsg);
    throw new Error(errorMsg || 'Erro ao validar matrícula e código da turma');
  }
};

export const getOrCreateSchool = async (schoolData: PortalSchool | string) => {
  if (!schoolData) return null;

  const rawName = typeof schoolData === 'string' ? schoolData : (schoolData.name || '');
  const name = rawName.trim();
  if (!name) return null;

  const inep = typeof schoolData === 'string' ? undefined : (schoolData.inep ? String(schoolData.inep).trim() : undefined);

  // Normalização do slug para o email da escola (remove acentos e caracteres especiais)
  const emailSlug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  const candidateEmail = `escola.${emailSlug}@educampina.local`;

  // 1. Tenta encontrar a escola por:
  // - INEP (se fornecido)
  // - Email da escola gerado
  // - Nome (case-insensitive)
  let school = await prisma.user.findFirst({
    where: {
      OR: [
        ...(inep ? [{ inep: { equals: inep } }] : []),
        { email: candidateEmail },
        { name: { equals: name, mode: 'insensitive' } }
      ]
    }
  });

  if (!school) {
    try {
      // Create new school unit with metadata
      school = await prisma.user.create({
        data: {
          email: candidateEmail,
          password: 'EXTERNAL_SSO_PLACEHOLDER',
          name: name,
          role: 'ESCOLA',
          verified: true,
          inep: inep || null,
          address: typeof schoolData === 'string' ? null : schoolData.address || null,
          zone: typeof schoolData === 'string' ? null : schoolData.zone || null,
          schoolType: typeof schoolData === 'string' ? 'Municipal' : schoolData.schoolType || 'Municipal'
        }
      });
    } catch (err) {
      // Se houver colisão de concorrência ou email já existente
      school = await prisma.user.findUnique({
        where: { email: candidateEmail }
      });

      if (!school) {
        // Fallback garantido com identificador único para nunca falhar constraint
        school = await prisma.user.create({
          data: {
            email: `escola.${emailSlug}.${Date.now()}@educampina.local`,
            password: 'EXTERNAL_SSO_PLACEHOLDER',
            name: name,
            role: 'ESCOLA',
            verified: true,
            inep: inep || null,
            address: typeof schoolData === 'string' ? null : schoolData.address || null,
            zone: typeof schoolData === 'string' ? null : schoolData.zone || null,
            schoolType: typeof schoolData === 'string' ? 'Municipal' : schoolData.schoolType || 'Municipal'
          }
        });
      }
    }
  } else {
    // Atualiza metadados se necessário
    const updates: any = {};
    if (inep && !school.inep) updates.inep = inep;
    if (school.role !== 'ESCOLA') updates.role = 'ESCOLA';
    if (typeof schoolData !== 'string') {
      if (schoolData.address && !school.address) updates.address = schoolData.address;
      if (schoolData.zone && !school.zone) updates.zone = schoolData.zone;
      if (schoolData.schoolType && !school.schoolType) updates.schoolType = schoolData.schoolType;
    }
    if (Object.keys(updates).length > 0) {
      school = await prisma.user.update({
        where: { id: school.id },
        data: updates
      });
    }
  }

  return school;
};
