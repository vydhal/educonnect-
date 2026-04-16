
import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../api';

interface SchoolUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
  school: string;
  schoolType?: string;
  schoolId?: string;
  _count?: {
    followers: number;
  };
}

const NetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('TODAS');
  const [selectedUnit, setSelectedUnit] = useState(''); // For Professor filter
  const [items, setItems] = useState<SchoolUser[]>([]);
  const [schoolsList, setSchoolsList] = useState<SchoolUser[]>([]); // For dropdown
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data: any[] = [];

        // Fetch list of schools for dropdown if not already fetched
        if (schoolsList.length === 0) {
          const allSchools = await usersAPI.getUsers('ESCOLA');
          setSchoolsList(allSchools);
        }

        if (filterType === 'PROFESSOR') {
          // Fetch teachers
          data = await usersAPI.getUsers({
            role: 'PROFESSOR',
            schoolId: selectedUnit || undefined,
            search: search.length >= 3 ? search : undefined
          });
        } else if (filterType === 'CRECHE') {
          data = await usersAPI.getUsers({
            role: 'ESCOLA',
            schoolType: 'CRECHE',
            search: search.length >= 3 ? search : undefined
          });
        } else if (filterType === 'ESCOLA') {
          data = await usersAPI.getUsers({
            role: 'ESCOLA',
            schoolType: 'ESCOLA',
            search: search.length >= 3 ? search : undefined
          });
        } else {
          // TODAS -> Get balanced mix or search all
          data = await usersAPI.getUsers({
            search: search.length >= 3 ? search : undefined
          });
        }

        setItems(data);
        
        // Initialize following state from data
        const followingIds = new Set<string>();
        data.forEach((item: any) => {
          if (item.isFollowing) followingIds.add(item.id);
        });
        setFollowing(followingIds);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterType, selectedUnit, search]); // Re-fetch on search changed (if search logic handled by server)

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
      // Use real count from server if available
      if (typeof response.followersCount === 'number') {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, _count: { ...item._count, followers: response.followersCount } } : item
        ));
      } else {
        updateFollowerCount(id, response.following);
      }
    } catch (error) {
      console.error('Failed to follow user', error);
    }
  };

  const updateFollowerCount = (id: string, increment: boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          _count: {
            ...item._count,
            followers: (item._count?.followers || 0) + (increment ? 1 : -1)
          }
        };
      }
      return item;
    }));
  };



  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="network" onLogout={() => navigate('/login')} />

      <main className="max-w-[1200px] mx-auto w-full p-4 md:p-6 pb-24 md:pb-8">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#0d121b] dark:text-white mb-2">Rede Municipal</h1>
            <p className="text-gray-500">Explore e conecte-se com as instituições e profissionais da rede de Campina Grande.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-14 bg-white dark:bg-gray-900 border-none rounded-2xl pl-12 pr-4 py-3 text-sm shadow-sm focus:ring-2 ring-primary/20 transition-all font-medium"
                placeholder="Buscar por nome, cargo ou unidade..."
              />
            </div>
          </div>
        </header>

        {/* Mobile Filter Tabs */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2 mb-4">
          {[
            { label: 'Todas', value: 'TODAS', icon: 'apps' },
            { label: 'Escolas', value: 'ESCOLA', icon: 'corporate_fare' },
            { label: 'Creches/CMEI', value: 'CRECHE', icon: 'child_care' },
            { label: 'Professores', value: 'PROFESSOR', icon: 'person' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterType(opt.value); setSelectedUnit(''); }}
              className={`flex items-center gap-2 whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all border-2 ${filterType === opt.value ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800'}`}
            >
              <span className="material-symbols-outlined text-sm">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters - HIDDEN ON MOBILE */}
          <aside className="hidden lg:block lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border sticky top-24">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Filtros
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Todas as Unidades', value: 'TODAS' },
                  { label: 'Escolas Municipais', value: 'ESCOLA' },
                  { label: 'Creches e CMEIs', value: 'CRECHE' },
                  { label: 'Professores', value: 'PROFESSOR' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterType(opt.value); setSelectedUnit(''); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${filterType === opt.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {filterType === 'PROFESSOR' && (
                <div className="mt-6 pt-6 border-t dark:border-gray-800">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Filtrar por Unidade</label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Todas as Unidades</option>
                    {schoolsList.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
            ) : items.length === 0 ? (
              <div className="text-center p-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border">
                {filterType === 'PROFESSOR' ? 'Nenhum professor encontrado.' : 'Nenhuma unidade ou usuário encontrado.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        onClick={() => navigate(`/profile/${item.id}`)}
                        className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden relative cursor-pointer"
                      >
                        {item.avatar ? (
                          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.avatar})` }} />
                        ) : (
                          <span className="material-symbols-outlined text-4xl">
                            {item.role === 'PROFESSOR' ? 'person' : 'corporate_fare'}
                          </span>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.role === 'PROFESSOR' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}>
                        {item.role === 'PROFESSOR' ? 'PROFESSOR' : (item.schoolType || 'ESCOLA')}
                      </span>
                    </div>
                    <h3
                      onClick={() => navigate(`/profile/${item.id}`)}
                      className="text-xl font-bold mb-1 dark:text-white truncate cursor-pointer hover:text-primary transition-colors"
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {item.school || 'Campina Grande'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-6">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Favoritos</p>
                        <p className="text-lg font-black text-primary">{item._count?.followers || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Status</p>
                        <p className="text-lg font-black text-green-500 w-max flex items-center gap-1"><span className="size-2 rounded-full bg-green-500 inline-block" /> Ativo</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (item.role === 'ESCOLA') handleFollow(item.id);
                        else navigate(`/profile/${item.id}`);
                      }}
                      className={`w-full mt-6 py-3.5 transition-all rounded-2xl font-black text-xs uppercase tracking-widest ${following.has(item.id) ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-primary/5 dark:bg-primary/10 hover:bg-primary hover:text-white text-primary'}`}
                    >
                      {item.role === 'ESCOLA' 
                        ? (following.has(item.id) ? 'Favoritado' : 'Favoritar Unidade')
                        : 'Ver Perfil / Amizade'}
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
