import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../prisma/client.js';

const PORTAL_API_URL = process.env.PORTAL_API_URL;
const PORTAL_API_KEY = process.env.PORTAL_API_KEY;
const SOCIAL_SSO_SECRET = process.env.SOCIAL_SSO_SECRET;

export interface PortalUser {
  email: string;
  name: string;
  role: string;
  schoolName?: string;
  schools?: string[];
}

const ROLE_MAP: Record<string, string> = {
  'ADMIN': 'ADMIN',
  'TEACHER': 'PROFESSOR',
  'STUDENT': 'ALUNO',
  'MANAGER': 'MODERADOR',
  'PEDAGOGICAL': 'COLABORADOR',
};

export const mapPortalRole = (portalRole: string): string => {
  return ROLE_MAP[portalRole] || 'ALUNO';
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

export const getOrCreateSchool = async (schoolName: string) => {
  if (!schoolName) return null;

  // Find school by name (Role ESCOLA)
  let school = await prisma.user.findFirst({
    where: {
      name: { equals: schoolName, mode: 'insensitive' },
      role: 'ESCOLA'
    }
  });

  if (!school) {
    // Create new school unit
    school = await prisma.user.create({
      data: {
        email: `escola.${schoolName.toLowerCase().replace(/\s+/g, '.')}@educampina.local`,
        password: 'EXTERNAL_SSO_PLACEHOLDER',
        name: schoolName,
        role: 'ESCOLA',
        verified: true,
        schoolType: 'Municipal'
      }
    });
  }

  return school;
};
