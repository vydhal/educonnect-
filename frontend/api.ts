// API client service
// Determine API base URL - prioritize environment variable, then use port 5000 on current host
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const { protocol, hostname } = window.location;

  // Se estivermos no localhost ou IP de rede, vamos garantir a porta 5001
  if (!envUrl || envUrl.includes(':5000') || envUrl.includes(':5001')) {
    return `${protocol}//${hostname}:5001/api`;
  }

  return envUrl;
};

const API_URL = getApiUrl();

// Helper to get full URL for media/uploads
export const getMediaUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Remove /api from end of API_URL to get base host
  const baseHost = API_URL.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseHost}${cleanPath}`;
};

// Helper to get role display title
export const getRoleTitle = (role: string | null | undefined) => {
  if (!role) return 'Membro';
  
  const roles: Record<string, string> = {
    'ADMIN': 'Administrador',
    'SEDUC': 'SEDUC',
    'EQUIPE_ESCOLAR': 'Equipe Escolar',
    'PROFESSOR': 'Educador',
    'ALUNO': 'Estudante',
    'ESCOLA': 'Instituição',
    'COMUNIDADE': 'Membro da Comunidade'
  };

  return roles[role] || role;
};

let token: string | null = localStorage.getItem('token');

export const setAuthToken = (newToken: string) => {
  token = newToken;
  localStorage.setItem('token', newToken);
};

export const getAuthToken = () => token;

export const clearAuthToken = () => {
  token = null;
  localStorage.removeItem('token');
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        clearAuthToken();
        window.location.href = '/login';
      }
      
      const text = await response.text();
      const error = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (err: any) {
    console.error('Fetch error:', err);
    throw err;
  }
};

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role: string; schoolId?: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request('/auth/profile'),
  updateProfile: (data: any) => request('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  // External Portal Auth
  externalLogin: (data: { email: string; password: string }) => 
    request('/auth/external/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  validateSSO: (token: string) => 
    request('/auth/external/sso', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),
};

// Posts API
export const postsAPI = {
  getPosts: (filters?: { tag?: string; search?: string; authorId?: string }) => {
    if (!filters) return request('/posts');
    const searchParams = new URLSearchParams();
    if (filters.tag) searchParams.append('tag', filters.tag);
    if (filters.search) searchParams.append('search', filters.search);
    if (filters.authorId) searchParams.append('authorId', filters.authorId);
    const queryString = searchParams.toString();
    return request(`/posts${queryString ? `?${queryString}` : ''}`);
  },
  getPost: (id: string) => request(`/posts/${id}`),
  createPost: (data: { content: string; image?: string; images?: string[] }) =>
    request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePost: (id: string, data: { content?: string; images?: string[] }) =>
    request(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  likePost: (id: string, type: string = 'LIKE') =>
    request(`/posts/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  addComment: (postId: string, data: { content: string }) =>
    request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateComment: (postId: string, commentId: string, data: { content: string }) =>
    request(`/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteComment: (postId: string, commentId: string) =>
    request(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
  deletePost: (id: string) =>
    request(`/posts/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersAPI = {
  getUsers: (params?: string | Record<string, any>) => {
    if (!params) return request('/users');
    
    if (typeof params === 'string') {
      // Compatibility with strings
      const query = params.includes('=') ? params : `role=${params}`;
      return request(`/users?${query}`);
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
    });
    
    return request(`/users?${searchParams.toString()}`);
  },
  getUser: (id: string) => request(`/users/${id}`),
  followUser: (id: string) =>
    request(`/users/${id}/follow`, {
      method: 'POST',
    }),
  getFollowers: (id: string) => request(`/users/${id}/followers`),
  getFollowing: (id: string) => request(`/users/${id}/following`),
  getFeaturedSchools: () => request('/users/featured-schools'),
  getUserProfile: (id: string) => request(`/users/${id}`),
  searchUsers: (query: string) => request(`/users/search/${query}`), // Fixed URL structure
};

// Moderation API
export const moderationAPI = {
  getItems: () => request('/moderation'),
  flagPost: (postId: string, reason: string) =>
    request(`/moderation/flag/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  approveItem: (id: string) =>
    request(`/moderation/${id}/approve`, {
      method: 'PUT',
    }),
  rejectItem: (id: string, data: { reason?: string; deletePost?: boolean }) =>
    request(`/moderation/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Projects API (Ideais que Inspiram)
export const projectsAPI = {
  getProjects: (params: string = '') => request(`/projects${params ? `?${params}` : ''}`),
  getProject: (id: string) => request(`/projects/${id}`),
  createProject: (data: any) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  like: (id: string) => request(`/projects/${id}/like`, { method: 'POST' }),
  favorite: (id: string) => request(`/projects/${id}/favorite`, { method: 'POST' }),
  addComment: (id: string, content: string) =>
    request(`/projects/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateProject: (id: string, data: any) =>
    request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Settings API
export const settingsAPI = {
  getPublicSettings: () => request('/settings'),
};

// Admin API
export const adminAPI = {
  getStats: () => request('/admin/stats'),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data: Record<string, string>) =>
    request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getUsers: (query: string) => request(`/admin/users?${query}`),
  deleteUser: (id: string) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUser: (id: string, data: any) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createUser: (data: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  exportUsers: () => {
    window.location.href = `${API_URL}/admin/users/export`;
  },
  importUsers: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Note: 'request' helper might not handle FormData automatically if it sets Content-Type to application/json
    // We might need a separate call or modify request to handle FormData
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/users/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) throw new Error('Falha na importação');
    return response.json();
  },
  getReports: (query: string = '') => request(`/admin/reports?${query}`),
  exportReports: async (query: string = '') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/reports/export?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Falha ao exportar relatório');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_educonnect_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // School Management
  getSchools: (query: string) => request(`/admin/schools?${query}`),
  createSchool: (data: any) => request('/admin/schools', { method: 'POST', body: JSON.stringify(data) }),
  importSchools: (schools: any[]) => request('/admin/schools/import', {
    method: 'POST',
    body: JSON.stringify({ schools })
  }),
  downloadSchoolTemplate: () => {
    window.location.href = `${API_URL}/admin/schools/template`;
  }
};

// Badge Types API
export const badgeTypesAPI = {
  getBadgeTypes: () => request('/badge-types'),
  createBadgeType: (data: { name: string; icon: string; description?: string; color?: string }) =>
    request('/badge-types', { method: 'POST', body: JSON.stringify(data) }),
  updateBadgeType: (id: string, data: any) =>
    request(`/badge-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBadgeType: (id: string) =>
    request(`/badge-types/${id}`, { method: 'DELETE' }),
};

// Social API
export const socialAPI = {
  giveBadge: (receiverId: string, badgeTypeId: string) =>
    request(`/social/badge/${receiverId}`, { method: 'POST', body: JSON.stringify({ badgeTypeId }) }),
  removeBadge: (receiverId: string, badgeTypeId: string) =>
    request(`/social/badge/${receiverId}/${badgeTypeId}`, { method: 'DELETE' }),
  getBadges: (userId: string) => request(`/social/badges/${userId}`),

  recordProfileView: (profileId: string) => request(`/social/profile-view/${profileId}`, { method: 'POST' }),
  getRecentVisitors: () => request('/social/profile-visitors'),

  sendTestimonial: (receiverId: string, content: string) =>
    request('/social/testimonial', { method: 'POST', body: JSON.stringify({ receiverId, content }) }),
  getTestimonials: (userId: string) => request(`/social/testimonials/${userId}`),
  getPendingTestimonials: () => request('/social/testimonials/pending'),
  updateTestimonialStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    request(`/social/testimonial/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getTrendingTags: () => request('/social/trending-tags'),
  getEvents: () => request('/social/events'),
  createEvent: (data: { name: string; date: string; link?: string }) =>
    request('/social/events', { method: 'POST', body: JSON.stringify(data) }),
  deleteEvent: (id: string) =>
    request(`/social/events/${id}`, { method: 'DELETE' }),

  // Friendship
  sendFriendRequest: (id: string) => request(`/social/friend-request/${id}`, { method: 'POST' }),
  updateFriendRequest: (id: string, status: 'ACCEPTED' | 'REJECTED') => 
    request(`/social/friend-request/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getPendingFriendRequests: () => request('/social/friend-requests/pending'),
  getFriends: (userId: string) => request(`/social/friends/${userId}`),
  removeFriend: (friendId: string) => request(`/social/friend/${friendId}`, { method: 'DELETE' }),
};

export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    // Upload endpoint
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }, // Optional depending on backend
      body: formData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Falha no upload');
    }
    return response.json(); // Returns { url: ... }
  }
};

// Support API
export const supportAPI = {
  getSupportItems: () => request('/support'),
  createSupportItem: (data: any) => request('/support', { method: 'POST', body: JSON.stringify(data) }),
  updateSupportItem: (id: string, data: any) => request(`/support/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupportItem: (id: string) => request(`/support/${id}`, { method: 'DELETE' }),
};

export const notificationsAPI = {
  getNotifications: () => request('/notifications'),
  markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// External System Integration (Educampina)
export const externalAPI = {
    getMilestones: async (): Promise<any[]> => {
        // Mocking with data from notifications.js structure
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 'm1',
                        title: "🚀 Marca de 10.000 Acessos!",
                        message: "Incrível! Alcançamos a marca de 10.000 acessos no Portal EduCampina! Obrigado por fazer parte dessa jornada de transformação educacional. 🚀À vocês, Gestores, Secretários e Professores, nossa gratidão! 🫶",
                        type: "celebration",
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'm2',
                        title: "🎉 36.000 Estudantes!",
                        message: "Uma marca histórica! Hoje o EduCampina orgulhosamente atende mais de 36.000 estudantes efetivados. Juntos, estamos construindo o futuro da educação! 🏫✨",
                        type: "celebration",
                        createdAt: new Date().toISOString()
                    }
                ]);
            }, 500);
        });
    }
};
