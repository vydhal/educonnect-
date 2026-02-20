
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
          // We can assume 'PROFESSOR' role. If searching by unit, we filter.
          // Current API might not support complex filtering on GET /users without implementation, but we did add support for schoolId
          let query = 'role=PROFESSOR';
          if (selectedUnit) {
            query += `&schoolId=${selectedUnit}`;
          }
          // We need to use 'usersAPI.getUsers' but passing query params manually or overloading the function?
          // usersAPI.getUsers takes a string 'role'. Let's check api.ts
          // `getUsers: (role?: string) => request(/users${role ? ?role=${role} : ''})`
          // It only accepts role. We need to cheat or update api.ts. 
          // Updating api.ts is cleaner, but for now let's append to role string if compatible, e.g. 'PROFESSOR&schoolId=...' 
          // `?role=PROFESSOR&schoolId=...` works if we pass `PROFESSOR&schoolId=${selectedUnit}`
          data = await usersAPI.getUsers(selectedUnit ? `PROFESSOR&schoolId=${selectedUnit}` : 'PROFESSOR');
        } else {
          // Fetch Schools
          // Filter by schoolType if needed
          let typeParam = 'ESCOLA'; // Role
          if (filterType !== 'TODAS' && filterType !== 'ESCOLA' && filterType !== 'CRECHE') {
            // Should not happen based on tabs, but safety
          }

          // If filter is CRECHE or ESCOLA (meaning EMEF/CMEI?), we can filter client side or backend.
          // Backend now supports schoolType param.
          // api.ts needs update or quirk usage.
          // Let's use the quirk: 'ESCOLA&schoolType=CRECHE'
          if (filterType === 'CRECHE') {
            data = await usersAPI.getUsers('ESCOLA&schoolType=CRECHE');
          } else if (filterType === 'EMEF' || filterType === 'ESCOLA') {
            // Assuming ESCOLA filter means 'EMEF' or standard school
            // If filterType is 'ESCOLA' (the tab name), we might mean ALL units? 
            // The user asked for "Escola", "Creche", "Professor".
            // If "Escola" means "Not Creche", we might need specific logic.
            // Let's assume 'ESCOLA' tab means schoolType='ESCOLA' (EMEF)
            data = await usersAPI.getUsers('ESCOLA&schoolType=ESCOLA');
          } else {
            // TODAS -> Get all ESCOLA role
            data = await usersAPI.getUsers('ESCOLA');
          }
        }

        setItems(data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterType, selectedUnit]);

  const handleFollow = async (id: string) => {
    try {
      const response = await usersAPI.followUser(id);
      if (response.following) {
        setFollowing(prev => new Set(prev).add(id));
        updateFollowerCount(id, true);
      } else {
        setFollowing(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        updateFollowerCount(id, false);
      }
    } catch (error) {
      console.error('Failed to follow user', error);
      // Revert if failed? For now keep simple
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
                {[
                  { label: 'Todas as Unidades', value: 'TODAS' },
                  { label: 'Escolas Municipais', value: 'ESCOLA' },
                  { label: 'Creches', value: 'CRECHE' },
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
            ) : items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="text-center p-12 text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border">
                {filterType === 'PROFESSOR' ? 'Nenhum professor encontrado.' : 'Nenhuma unidade encontrada.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(item => (
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
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Seguidores</p>
                        <p className="text-lg font-black text-primary">{item._count?.followers || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Status</p>
                        <p className="text-lg font-black text-green-500 w-max flex items-center gap-1"><span className="size-2 rounded-full bg-green-500 inline-block" /> Ativo</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(item.id)}
                      className={`w-full mt-6 py-3 transition-all rounded-xl font-bold text-sm ${following.has(item.id) ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white text-primary'}`}
                    >
                      {following.has(item.id) ? 'Seguindo' : (item.role === 'PROFESSOR' ? 'Seguir Professor' : 'Seguir Unidade')}
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
