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

  const name = typeof schoolData === 'string' ? schoolData : schoolData.name;
  const inep = typeof schoolData === 'string' ? undefined : schoolData.inep;

  // Try to find school by INEP or Name (Role ESCOLA)
  let school = await prisma.user.findFirst({
    where: {
      OR: [
        ...(inep ? [{ inep: { equals: inep } }] : []),
        { name: { equals: name, mode: 'insensitive' } }
      ],
      role: 'ESCOLA'
    }
  });

  if (!school) {
    // Create new school unit with metadata
    school = await prisma.user.create({
      data: {
        email: `escola.${name.toLowerCase().replace(/\s+/g, '.')}@educampina.local`,
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
  } else if (typeof schoolData !== 'string') {
    // Update existing school with metadata if missing
    await prisma.user.update({
      where: { id: school.id },
      data: {
        inep: school.inep || schoolData.inep || null,
        address: school.address || schoolData.address || null,
        zone: school.zone || schoolData.zone || null,
        schoolType: school.schoolType || schoolData.schoolType || 'Municipal'
      }
    });
  }

  return school;
};
