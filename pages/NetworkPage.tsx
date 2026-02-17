
import React, { useState } from 'react';
import { Header } from './FeedPage';
import { useNavigate } from 'react-router-dom';

const NetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('TODAS');

  const schools = [
    { id: '1', name: 'EMEF Raul Córdula', type: 'EMEF', zone: 'Centro', students: 850, teachers: 45 },
    { id: '2', name: 'Creche Municipal Pequeno Príncipe', type: 'CRECHE', zone: 'Malvinas', students: 200, teachers: 12 },
    { id: '3', name: 'EMEF Tiradentes', type: 'EMEF', zone: 'Bodocongó', students: 600, teachers: 32 },
    { id: '4', name: 'Escola Municipal Anísio Teixeira', type: 'ESCOLA', zone: 'Catolé', students: 450, teachers: 28 },
    { id: '5', name: 'Creche Municipal Maria das Dores', type: 'CRECHE', zone: 'Centro', students: 150, teachers: 10 },
  ];

  const filteredSchools = schools.filter(s => 
    (filterType === 'TODAS' || s.type === filterType) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSchools.map(school => (
              <div key={school.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-4xl">corporate_fare</span>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase text-gray-500 tracking-wider">
                    {school.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1 dark:text-white">{school.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-6">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {school.zone}, Campina Grande
                </p>
                <div className="grid grid-cols-2 gap-4 border-t dark:border-gray-800 pt-6">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Alunos</p>
                    <p className="text-lg font-black text-primary">{school.students}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Docentes</p>
                    <p className="text-lg font-black text-primary">{school.teachers}</p>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-primary hover:text-white transition-all rounded-xl font-bold text-sm text-primary">
                  Ver Mural Escolar
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NetworkPage;
