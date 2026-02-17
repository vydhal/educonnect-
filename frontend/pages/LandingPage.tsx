
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-[#e7ebf3] bg-white/80 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-primary">
            <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
            <h2 className="text-[#0d121b] text-xl font-extrabold tracking-tight">EduConnect CG</h2>
          </div>
          <nav className="hidden md:flex gap-9">
            <a href="#sobre" className="text-sm font-medium hover:text-primary transition-colors">Sobre</a>
            <a href="#recursos" className="text-sm font-medium hover:text-primary transition-colors">Recursos</a>
            <a href="#escolas" className="text-sm font-medium hover:text-primary transition-colors">Escolas</a>
          </nav>
          <button 
            onClick={() => navigate('/login')}
            className="bg-primary text-white text-sm font-bold px-6 py-2 rounded-lg hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            Entrar
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 py-10 flex justify-center">
          <div 
            className="max-w-[1200px] w-full min-h-[520px] rounded-2xl bg-cover bg-center flex flex-col justify-end p-8 md:p-16 relative overflow-hidden shadow-2xl"
            style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${IMAGES.HERO})` }}
          >
            <div className="max-w-[700px] text-white z-10">
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
                Conectando a Educação de Campina Grande
              </h1>
              <p className="text-lg md:text-xl font-light opacity-90 mb-8">
                Uma rede social exclusiva para integrar alunos, professores e a Secretaria Municipal de Educação em um só ambiente colaborativo.
              </p>
              <button 
                onClick={() => navigate('/profile-selection')}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-4 px-10 rounded-xl shadow-xl flex items-center gap-2 transition-all w-fit"
              >
                Começar agora
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-10">
          <div className="bg-white p-8 rounded-2xl border border-[#cfd7e7] shadow-sm text-center flex flex-col items-center hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-primary text-5xl mb-3">school</span>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Alunos</p>
            <p className="text-primary text-4xl font-black">15k+</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[#cfd7e7] shadow-sm text-center flex flex-col items-center hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-primary text-5xl mb-3">person_pin</span>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Professores</p>
            <p className="text-primary text-4xl font-black">2k+</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-[#cfd7e7] shadow-sm text-center flex flex-col items-center hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-primary text-5xl mb-3">location_city</span>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Escolas</p>
            <p className="text-primary text-4xl font-black">120+</p>
          </div>
        </section>

        {/* Features */}
        <section id="recursos" className="bg-white py-20 px-6">
          <div className="max-w-[1200px] mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-primary mb-4">Recursos da Plataforma</h2>
            <div className="h-1.5 w-20 bg-accent-orange mx-auto rounded-full"></div>
          </div>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="group" 
              title="Colaboração" 
              desc="Espaço centralizado para compartilhamento de planos de aula, atividades e materiais didáticos entre docentes." 
            />
            <FeatureCard 
              icon="campaign" 
              title="Informativos" 
              desc="Fique por dentro de todos os avisos oficiais, editais e novidades da rede municipal de ensino." 
            />
            <FeatureCard 
              icon="assignment_ind" 
              title="Perfis Escolares" 
              desc="Cada unidade escolar possui seu próprio mural para eventos, reuniões e comunicação direta com os pais." 
            />
          </div>
        </section>
      </main>

      <footer className="bg-[#f6f6f8] py-16 px-6 border-t border-[#e7ebf3]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 text-primary mb-6">
              <span className="material-symbols-outlined font-fill-1">auto_awesome</span>
              <h2 className="text-lg font-bold">EduConnect CG</h2>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Plataforma oficial da Secretaria Municipal de Educação de Campina Grande para integração e comunicação da rede pública de ensino.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#0d121b] mb-6">Links Rápidos</h3>
            <ul className="text-sm text-gray-500 space-y-3">
              <li><a href="#" className="hover:text-primary transition-colors">Portal do Aluno</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Portal do Professor</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">SME Campina Grande</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Ajuda & Suporte</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-[#0d121b] mb-6">Contato</h3>
            <p className="text-sm text-gray-500">
              Av. Rio Branco, S/N - Centro<br />
              Campina Grande - PB<br />
              contato@educonnectcg.com.br
            </p>
          </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-[#e7ebf3] text-xs text-gray-400">
          © 2024 EduConnect CG. Desenvolvido para a Prefeitura de Campina Grande.
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{icon: string, title: string, desc: string}> = ({ icon, title, desc }) => (
  <div className="p-8 rounded-2xl bg-[#f6f6f8] border border-[#cfd7e7] hover:shadow-lg transition-all group">
    <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
