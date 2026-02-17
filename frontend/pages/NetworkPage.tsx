
import React, { useState, useEffect } from 'react';
import { Header } from './FeedPage';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../api';

interface SchoolUser {
  id: string;
  name: string;
  role: string;
  avatar: string; // or null/undefined
  school: string; // This might be the type or zone in our new logic, but DB calls it 'school'
  _count?: {
    followers: number;
  };
}

const NetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('TODAS');
  const [schools, setSchools] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        // Fetch all users with role 'ESCOLA'. 
        // If your system uses 'ALUNO'/'PROFESSOR' mostly, ensure you have 'ESCOLA' users or fetch all to see.
        // For now, let's assume valid schools have role 'ESCOLA' or 'ADMIN' (as temporary placement)
        // Adjust 'ESCOLA' to match exactly what's in your DB (case sensitive often)
        const data = await usersAPI.getUsers('ESCOLA');
        setSchools(data);
      } catch (error) {
        console.error('Failed to fetch schools', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleFollow = async (id: string) => {
    try {
      const response = await usersAPI.followUser(id);
      if (response.following) {
        setFollowing(prev => new Set(prev).add(id));
      } else {
        setFollowing(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to follow user', error);
    }
  };

  const filteredSchools = schools.filter(s => {
    // Infer type from name if possible, or use 'TODAS'
    const type = s.name.toUpperCase().includes('EMEF') ? 'EMEF' :
      s.name.toUpperCase().includes('CRECHE') ? 'CRECHE' : 'ESCOLA';

    const matchesType = filterType === 'TODAS' || type === filterType;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="network" onLogout={() => navigate('/login')} />

      <main className="max-w-[1200px] mx-auto w-full p-6">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#0d121b] dark:text-white mb-2">Rede de Unidades</h1>
            <p className="text-gray-500">Explore e conecte-se com as instituições da rede municipal de Campina Grande.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-3 text-sm shadow-sm"
                placeholder="Buscar escola..."
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border sticky top-24">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Filtros
              </h3>
              <div className="space-y-2">
                {['TODAS', 'EMEF', 'CRECHE', 'ESCOLA'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${filterType === type ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
            ) : filteredSchools.length === 0 ? (
              <div className="text-center p-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border">Nenhuma escola encontrada.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSchools.map(school => (
                  <div key={school.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden relative">
                        {school.avatar ? (
                          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${school.avatar})` }} />
                        ) : (
                          <span className="material-symbols-outlined text-4xl">corporate_fare</span>
                        )}
                      </div>
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase text-gray-500 tracking-wider">
                        {school.name.toUpperCase().includes('CRECHE') ? 'CRECHE' : 'ESCOLA'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 dark:text-white truncate" title={school.name}>{school.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {school.school || 'Campina Grande'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-6">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Seguidores</p>
                        <p className="text-lg font-black text-primary">{school._count?.followers || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Status</p>
                        <p className="text-lg font-black text-green-500 w-max flex items-center gap-1"><span className="size-2 rounded-full bg-green-500 inline-block" /> Ativo</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(school.id)}
                      className={`w-full mt-6 py-3 transition-all rounded-xl font-bold text-sm ${following.has(school.id) ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white text-primary'}`}
                    >
                      {following.has(school.id) ? 'Seguindo' : 'Seguir Unidade'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NetworkPage;
