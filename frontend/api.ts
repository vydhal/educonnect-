// API client service
// Determine API base URL - prioritize environment variable, then use port 5000 on current host
const getApiUrl = () => {
  // Check if VITE_API_URL is set in environment
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    console.log('Using VITE_API_URL:', envUrl);
    return envUrl;
  }

  // Fallback: construct URL based on current host
  const protocol = window.location.protocol; // http: or https:
  const hostname = window.location.hostname; // localhost
  const apiUrl = `${protocol}//${hostname}:5000/api`;
  console.log('Using fallback API URL:', apiUrl);
  return apiUrl;
};

const API_URL = getApiUrl();
console.log('Final API_URL:', API_URL);

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
  console.log('API Request:', url);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        window.location.href = '/login';
      }
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    console.error('Fetch error:', err);
    throw err;
  }
};

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; name: string; role: string }) =>
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
};

// Posts API
export const postsAPI = {
  getPosts: () => request('/posts'),
  getPost: (id: string) => request(`/posts/${id}`),
  createPost: (data: { content: string; image?: string }) =>
    request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  likePost: (id: string, type: string = 'LIKE') =>
    request(`/posts/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  addComment: (id: string, data: { content: string }) =>
    request(`/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePost: (id: string) =>
    request(`/posts/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersAPI = {
  getUsers: (role?: string) => request(`/users${role ? `?role=${role}` : ''}`),
  getUser: (id: string) => request(`/users/${id}`),
  followUser: (id: string) =>
    request(`/users/${id}/follow`, {
      method: 'POST',
    }),
  getFollowers: (id: string) => request(`/users/${id}/followers`),
  getFollowing: (id: string) => request(`/users/${id}/following`),
  searchUsers: (query: string) => request(`/users/search/${query}`),
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

// Projects API
export const projectsAPI = {
  getProjects: () => request('/projects'),
  getProject: (id: string) => request(`/projects/${id}`),
  createProject: (data: { title: string; description: string; image?: string; category?: string }) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByCategory: (category: string) => request(`/projects/category/${category}`),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, {
      method: 'DELETE',
    }),
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
  getReports: () => request('/admin/reports'),

  // School Management
  getSchools: (query: string) => request(`/admin/schools?${query}`),
  createSchool: (data: any) => request('/admin/schools', { method: 'POST', body: JSON.stringify(data) }),
  importSchools: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/schools/import`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) throw new Error('Falha na importação');
    return response.json();
  }
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
