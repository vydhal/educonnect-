
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

const ProfileSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);

  const profiles = [
    { role: 'PROFESSOR' as UserRole, icon: 'person_search', label: 'Professor', desc: 'Educadores e coordenadores pedagógicos' },
    { role: 'ALUNO' as UserRole, icon: 'school', label: 'Aluno', desc: 'Estudantes da rede municipal' },
    { role: 'ESCOLA' as UserRole, icon: 'corporate_fare', label: 'Escola', desc: 'Gestão institucional e administrativa' },
    { role: 'COMUNIDADE' as UserRole, icon: 'groups', label: 'Comunidade', desc: 'Pais, responsáveis e parceiros externos' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="px-10 py-6 border-b flex justify-between items-center">
        <div className="flex items-center gap-3 text-primary">
          <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
          <h2 className="text-xl font-bold">EduConnect CG</h2>
        </div>
        <button onClick={() => navigate('/login')} className="bg-primary text-white font-bold px-6 py-2 rounded-lg">Entrar</button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-black text-center mb-4">Escolha seu perfil</h1>
        <p className="text-gray-500 text-center max-w-xl mb-12">
          Selecione a opção que melhor descreve sua atuação na rede municipal de Campina Grande para personalizarmos sua experiência.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1200px]">
          {profiles.map(p => (
            <div 
              key={p.role}
              onClick={() => setSelected(p.role)}
              className={`p-8 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${
                selected === p.role ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`size-16 rounded-full flex items-center justify-center transition-colors ${
                selected === p.role ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              }`}>
                <span className="material-symbols-outlined text-3xl">{p.icon}</span>
              </div>
              <h3 className="text-xl font-bold">{p.label}</h3>
              <p className="text-sm text-gray-500">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <button 
            disabled={!selected}
            onClick={() => navigate(`/register/${selected?.toLowerCase()}`)}
            className={`min-w-[280px] h-14 rounded-xl font-bold text-lg shadow-lg transition-all ${
              selected ? 'bg-primary text-white shadow-primary/25 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Continuar
          </button>
        </div>

        <p className="mt-8 text-gray-400 text-xs text-center">
          Ao continuar, você concorda com os nossos Termos de Uso e Política de Privacidade.
        </p>
      </main>
    </div>
  );
};

export default ProfileSelectionPage;
