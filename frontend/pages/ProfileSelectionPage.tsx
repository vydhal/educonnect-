import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { settingsAPI } from '../api';

const ProfileSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [branding, setBranding] = useState({ name: 'EduConnect', logo: '' });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const settings = await settingsAPI.getPublicSettings();
        if (settings.APP_NAME) setBranding(prev => ({ ...prev, name: settings.APP_NAME }));
        if (settings.LOGO_URL) setBranding(prev => ({ ...prev, logo: settings.LOGO_URL }));
      } catch (err) {
        console.error('Failed to fetch branding:', err);
      }
    };
    fetchBranding();
  }, []);

  const profiles = [
    { role: 'PROFESSOR' as UserRole, icon: 'person_search', label: 'Professor', desc: 'Educadores e coordenadores pedagógicos' },
    { role: 'ALUNO' as UserRole, icon: 'school', label: 'Aluno', desc: 'Estudantes da rede municipal' },
    { role: 'COMUNIDADE' as UserRole, icon: 'groups', label: 'Comunidade', desc: 'Pais, responsáveis e parceiros externos' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <header className="px-10 py-6 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shadow-sm z-10">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-3 text-primary cursor-pointer hover:opacity-80 transition-all"
        >
          {branding.logo ? (
            <img src={branding.logo} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
          )}
          <h2 className="text-xl font-bold font-display dark:text-gray-100">{branding.name}</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-bold transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Voltar ao site
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all text-sm"
          >
            Entrar
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950 transition-colors">
        <h1 className="text-3xl font-black text-center mb-4 dark:text-gray-100">Escolha seu perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-xl mb-12">
          Selecione a opção que melhor descreve sua atuação na rede municipal de Campina Grande para personalizarmos sua experiência.
        </p>

        <div className="flex flex-wrap justify-center gap-8 w-full max-w-[1100px]">
          {profiles.map(p => (
            <div
              key={p.role}
              onClick={() => setSelected(p.role)}
              className={`p-10 rounded-3xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-6 w-full md:w-[320px] ${selected === p.role 
                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xl scale-105' 
                : 'border-white dark:border-gray-900 bg-white dark:bg-gray-900 shadow-sm hover:border-gray-200 dark:hover:border-gray-800 hover:shadow-lg'
                }`}
            >
              <div className={`size-16 rounded-full flex items-center justify-center transition-colors ${selected === p.role ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                }`}>
                <span className="material-symbols-outlined text-3xl">{p.icon}</span>
              </div>
              <h3 className="text-xl font-bold dark:text-gray-100">{p.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <button
            disabled={!selected || selected === 'ALUNO' || selected === 'COMUNIDADE'}
            onClick={() => navigate(`/register/${selected?.toLowerCase()}`)}
            className={`min-w-[280px] h-14 rounded-xl font-bold text-lg shadow-lg transition-all ${selected && selected !== 'ALUNO' && selected !== 'COMUNIDADE'
              ? 'bg-primary text-white shadow-primary/25 active:scale-95'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
          >
            {selected === 'ALUNO' || selected === 'COMUNIDADE' ? 'Em Breve' : 'Continuar'}
          </button>
        </div>

        <p className="mt-8 text-gray-400 dark:text-gray-500 text-xs text-center">
          Ao continuar, você concorda com os nossos Termos de Uso e Política de Privacidade.
        </p>
      </main>
    </div>
  );
};

export default ProfileSelectionPage;
