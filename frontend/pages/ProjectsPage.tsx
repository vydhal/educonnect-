
import React, { useState } from 'react';
import { Header } from './FeedPage';
import { useNavigate } from 'react-router-dom';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [activeArea, setActiveArea] = useState('TODOS');

  const areas = ['TODOS', 'Ciências', 'Linguagens', 'Matemática', 'Artes', 'História', 'Tecnologia'];

  const projects = [
    { id: '1', title: 'Horta Circular Sustentável', area: 'Ciências', author: 'Prof. Ana Lúcia', date: 'Maio 2024', downloads: 152 },
    { id: '2', title: 'Robótica com Sucata', area: 'Tecnologia', author: 'Prof. Carlos M.', date: 'Abril 2024', downloads: 89 },
    { id: '3', title: 'Sarau Literário Nordestino', area: 'Linguagens', author: 'Prof. Júlia R.', date: 'Junho 2024', downloads: 210 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="projects" onLogout={() => navigate('/login')} />

      <main className="max-w-[1200px] mx-auto w-full p-6">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-primary mb-3">
              <span className="material-symbols-outlined font-fill-1">inventory_2</span>
              <span className="text-xs font-black uppercase tracking-widest">Repositório Pedagógico</span>
            </div>
            <h1 className="text-4xl font-black text-[#0d121b] dark:text-white mb-2">Projetos Educacionais</h1>
            <p className="text-gray-500 max-w-2xl">Acesse e compartilhe planos de aula, projetos de intervenção e atividades inovadoras da rede.</p>
          </div>
          <button 
            onClick={() => setIsSubmitOpen(true)}
            className="bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Submeter Projeto
          </button>
        </header>

        {/* Areas Filter */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
          {areas.map(area => (
            <button 
              key={area}
              onClick={() => setActiveArea(area)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${activeArea === area ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white dark:bg-gray-900 border-white dark:border-gray-800 text-gray-500 hover:border-primary/20'}`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.filter(p => activeArea === 'TODOS' || p.area === activeArea).map(project => (
            <div key={project.id} className="bg-white dark:bg-gray-900 rounded-3xl p-8 border shadow-sm hover:shadow-xl transition-all flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="px-4 py-1.5 bg-accent-orange/10 text-accent-orange rounded-full text-[10px] font-black uppercase tracking-wider">
                  {project.area}
                </span>
                <span className="material-symbols-outlined text-gray-300">bookmark</span>
              </div>
              <h3 className="text-2xl font-black mb-4 dark:text-white leading-tight flex-1">{project.title}</h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gray-100" />
                  <div>
                    <p className="text-sm font-bold">{project.author}</p>
                    <p className="text-xs text-gray-400">{project.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span> {project.downloads}</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span> 1.2k</span>
                </div>
              </div>
              <button className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">description</span>
                Acessar Material
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* SUBMIT PROJECT MODAL */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSubmitOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-[650px] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">Submeter Novo Projeto</h2>
                <p className="text-xs text-gray-500">Compartilhe sua prática pedagógica com a rede municipal.</p>
              </div>
              <button onClick={() => setIsSubmitOpen(false)} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><span className="material-symbols-outlined text-gray-400">close</span></button>
            </div>
            <form className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Título do Projeto</label>
                <input required className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4" placeholder="Ex: Projeto Reciclar é Aprender" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Área de Conhecimento</label>
                  <select className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 appearance-none">
                    <option>Ciências</option>
                    <option>Matemática</option>
                    <option>Linguagens</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Público-alvo (Ano)</label>
                  <select className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 appearance-none">
                    <option>Ensino Fundamental I</option>
                    <option>Ensino Fundamental II</option>
                    <option>Educação Infantil</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Resumo do Projeto</label>
                <textarea className="w-full h-32 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 resize-none" placeholder="Breve descrição dos objetivos e resultados..." />
              </div>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-4xl text-gray-300 group-hover:text-primary transition-colors mb-2">cloud_upload</span>
                <p className="text-sm font-bold text-gray-500">Arraste seus arquivos (PDF, DOCX, ZIP)</p>
                <p className="text-xs text-gray-400 mt-1">Limite máximo de 20MB</p>
              </div>
            </form>
            <div className="p-8 border-t dark:border-gray-800">
              <button 
                onClick={() => setIsSubmitOpen(false)}
                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Cadastrar Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
