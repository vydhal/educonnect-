
import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, uploadAPI, postsAPI } from '../api';
import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnUnderline, BtnLink, BtnStrikeThrough, BtnNumberedList, BtnBulletList, BtnClearFormatting } from 'react-simple-wysiwyg';

const ETAPAS = {
  'INFANTIL': ['Exploração Sensorial', 'Corpo e Movimento', 'Traços e Cores', 'Escuta e Fala', 'Espaços e Tempos'],
  'ANOS_INICIAIS': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Ensino Religioso'],
  'ANOS_FINAIS': ['Língua Portuguesa', 'Matemática', 'Ciências', 'História', 'Geografia', 'Arte', 'Educação Física', 'Língua Inglesa', 'Ensino Religioso'],
  'EJA': ['Alfabetização', 'Cidadania e Trabalho', 'Cultura e Sociedade', 'Ciência e Tecnologia', 'Meio Ambiente']
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEtapa, setActiveEtapa] = useState('TODOS');
  const [activeComponente, setActiveComponente] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [commentContent, setCommentContent] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    etapa: 'ANOS_INICIAIS',
    componente: 'Matemática',
    image: '',
    images: [] as string[]
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (activeEtapa !== 'TODOS') query.append('etapa', activeEtapa);
      if (activeComponente !== 'TODOS') query.append('componente', activeComponente);
      if (searchTerm) query.append('search', searchTerm);

      const data = await projectsAPI.getProjects(query.toString());
      setProjects(data);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [activeEtapa, activeComponente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const project = await projectsAPI.createProject(formData);

      // Postar no Feed automaticamente
      try {
        await postsAPI.createPost({
          content: `🚀 Publiquei uma nova inspiração: **${formData.title}**\n\n${formData.description}\n\nConfira em "Ideais que Inspiram"!`,
          image: formData.image || undefined,
          images: formData.images.length > 0 ? formData.images : undefined
        });
      } catch (feedErr) {
        console.error('Falha ao postar no feed:', feedErr);
      }

      setIsSubmitOpen(false);
      fetchProjects();
      setFormData({
        title: '',
        description: '',
        content: '',
        etapa: 'ANOS_INICIAIS',
        componente: 'Matemática',
        image: '',
        images: []
      });
    } catch (error) {
      alert('Erro ao publicar: ' + error);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await projectsAPI.like(id);
      fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFavorite = async (id: string) => {
    try {
      await projectsAPI.favorite(id);
      fetchProjects();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadAPI.uploadImage(file);
      if (isMain) {
        setFormData(prev => ({ ...prev, image: url }));
      } else {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      }
    } catch (error) {
      alert('Erro no upload');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !selectedProject) return;
    try {
      await projectsAPI.addComment(selectedProject.id, commentContent);
      setCommentContent('');
      // Refresh current project data
      const updated = await projectsAPI.getProject(selectedProject.id);
      setSelectedProject(updated);
      fetchProjects();
    } catch (error) {
      alert('Erro ao comentar');
    }
  };

  const openDetail = async (project: any) => {
    try {
      const fullProject = await projectsAPI.getProject(project.id);
      setSelectedProject(fullProject);
      setIsDetailOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-background-dark">
      <Header activeTab="projects" onLogout={() => navigate('/login')} />

      <main className="max-w-[1200px] mx-auto w-full p-6">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-primary mb-3">
              <span className="material-symbols-outlined font-fill-1">tips_and_updates</span>
              <span className="text-xs font-black uppercase tracking-widest">Práticas Pedagógicas</span>
            </div>
            <h1 className="text-4xl font-black text-[#0d121b] dark:text-white mb-2">Ideais que Inspiram</h1>
            <p className="text-gray-500 max-w-2xl">Conecte-se com as experiências transformadoras de outros educadores e compartilhe sua história.</p>
          </div>
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">edit_note</span>
            Criar Nova Inspiração
          </button>
        </header>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border mb-10 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                placeholder="Buscar por título, conteúdo ou tema..."
                className="w-full h-12 bg-gray-50 dark:bg-gray-800 border-none rounded-xl pl-12 pr-4 focus:ring-2 ring-primary/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {['TODOS', ...Object.keys(ETAPAS)].map(e => (
                <button
                  key={e}
                  onClick={() => { setActiveEtapa(e); setActiveComponente('TODOS'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeEtapa === e ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                >
                  {e.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {activeEtapa !== 'TODOS' && (
            <div className="flex gap-2 flex-wrap animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => setActiveComponente('TODOS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeComponente === 'TODOS' ? 'bg-accent-orange text-white' : 'bg-orange-50 dark:bg-orange-950/20 text-accent-orange'}`}
              >
                Todos Componentes
              </button>
              {(ETAPAS as any)[activeEtapa].map((c: string) => (
                <button
                  key={c}
                  onClick={() => setActiveComponente(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeComponente === c ? 'bg-accent-orange text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <div key={project.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border shadow-sm hover:shadow-2xl transition-all flex flex-col overflow-hidden group">
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {project.image ? (
                    <img src={project.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent-orange/10">
                      <span className="material-symbols-outlined text-4xl text-primary/30">auto_stories</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-wider text-primary shadow-sm">
                      {project.etapa.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => openDetail(project)}
                  className="p-8 flex flex-col flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <img src={project.author.avatar || `https://ui-avatars.com/api/?name=${project.author.name}`} alt="" className="size-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate">{project.author.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{project.author.school || 'Rede Municipal'}</p>
                    </div>
                    <span className="text-[10px] text-gray-300 font-bold whitespace-nowrap">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-black mb-3 dark:text-white leading-tight min-h-[3rem] line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-auto pt-6 border-t dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(project.id)}
                        className="flex items-center gap-1.5 group/btn"
                      >
                        <span className={`material-symbols-outlined text-xl transition-colors ${project.isLiked ? 'text-red-500 font-fill-1' : 'text-gray-400 group-hover/btn:text-red-500'}`}>favorite</span>
                        <span className="text-xs font-black text-gray-400">{project._count.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 group/btn">
                        <span className="material-symbols-outlined text-xl text-gray-400 group-hover/btn:text-primary transition-colors">comment</span>
                        <span className="text-xs font-black text-gray-400">{project._count.comments}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => handleFavorite(project.id)}
                      className={`material-symbols-outlined transition-colors ${project.isFavorited ? 'text-accent-orange font-fill-1' : 'text-gray-300 hover:text-accent-orange'}`}
                    >
                      bookmark
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsSubmitOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-[1000px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <h2 className="text-3xl font-black">Escrever Inspiração</h2>
                <p className="text-sm text-gray-500">Inspire outros professores com sua prática pedagógia.</p>
              </div>
              <button onClick={() => setIsSubmitOpen(false)} className="size-12 flex items-center justify-center rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined text-gray-400">close</span></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Título da Inspiração</label>
                    <input
                      required
                      className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 font-bold"
                      placeholder="Ex: Transformando a Geometria com Origami"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Etapa</label>
                      <select
                        className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 font-bold appearance-none"
                        value={formData.etapa}
                        onChange={e => setFormData({ ...formData, etapa: e.target.value, componente: (ETAPAS as any)[e.target.value][0] })}
                      >
                        {Object.keys(ETAPAS).map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Componente</label>
                      <select
                        className="w-full h-14 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 font-bold appearance-none"
                        value={formData.componente}
                        onChange={e => setFormData({ ...formData, componente: e.target.value })}
                      >
                        {(ETAPAS as any)[formData.etapa].map((c: string) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Resumo Curto</label>
                    <textarea
                      required
                      className="w-full h-24 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-6 font-medium resize-none"
                      placeholder="Um breve resumo do que se trata..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Capa do Projeto</label>
                  <div className="h-full min-h-[16rem] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
                    {formData.image ? (
                      <img src={formData.image} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 group-hover:text-primary mb-2">add_photo_alternate</span>
                        <p className="text-xs font-bold text-gray-400">Clique para carregar uma capa impactante</p>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, true)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Conteúdo Completo (Blog)</label>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl overflow-hidden p-2 min-h-[300px]">
                  <EditorProvider>
                    <Editor
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Escreva aqui sua prática detalhada, objetivos, materiais e resultados..."
                      className="min-h-[300px] border-none !bg-transparent text-gray-700 dark:text-gray-300"
                    >
                      <Toolbar>
                        <BtnBold />
                        <BtnItalic />
                        <BtnUnderline />
                        <BtnStrikeThrough />
                        <BtnLink />
                        <BtnNumberedList />
                        <BtnBulletList />
                        <BtnClearFormatting />
                      </Toolbar>
                    </Editor>
                  </EditorProvider>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Galeria de Fotos (Opcional)</label>
                <div className="flex gap-4 flex-wrap">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="size-24 rounded-2xl overflow-hidden relative group">
                      <img src={img} className="size-full object-cover" alt="" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, images: formData.images.filter((_, i) => i !== idx) })}
                        className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                  <div className="size-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center relative hover:border-primary transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-gray-300">add</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileUpload(e, false)} />
                  </div>
                </div>
              </div>
            </form>

            <div className="px-10 py-8 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsSubmitOpen(false)}
                className="px-8 py-4 font-black text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Publicar Inspiração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsDetailOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-[900px] rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
            <div className="h-64 bg-gray-100 relative">
              {selectedProject.image && <img src={selectedProject.image} className="w-full h-full object-cover" alt="" />}
              <button onClick={() => setIsDetailOpen(false)} className="absolute top-6 right-6 size-12 bg-black/20 hover:bg-black/40 backdrop-blur rounded-2xl flex items-center justify-center text-white transition-all"><span className="material-symbols-outlined">close</span></button>
              <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/60 to-transparent text-white">
                <span className="px-3 py-1 bg-primary rounded-lg text-xs font-black uppercase mb-3 inline-block">{selectedProject.etapa}</span>
                <h2 className="text-4xl font-black leading-tight">{selectedProject.title}</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              <div className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl">
                <img src={selectedProject.author.avatar || `https://ui-avatars.com/api/?name=${selectedProject.author.name}`} className="size-12 rounded-full" alt="" />
                <div>
                  <p className="font-black text-lg">{selectedProject.author.name}</p>
                  <p className="text-sm text-gray-400 font-bold uppercase">{selectedProject.author.school || 'Rede Municipal'}</p>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedProject.content }} className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg" />
              </div>

              {selectedProject.images && selectedProject.images.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xl font-black">Galeria de Fotos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProject.images.map((img: string, i: number) => (
                      <img key={i} src={img} className="rounded-2xl w-full h-48 object-cover border" alt="" />
                    ))}
                  </div>
                </div>
              )}

              <section className="pt-12 border-t dark:border-gray-800 space-y-8">
                <h4 className="text-2xl font-black flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">forum</span>
                  Comentários ({selectedProject._count.comments})
                </h4>

                <form onSubmit={handleComment} className="relative">
                  <textarea
                    className="w-full h-24 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-6 pr-20 resize-none font-medium"
                    placeholder="O que achou desta inspiração?"
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                  />
                  <button className="absolute right-4 bottom-4 size-12 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </form>

                <div className="space-y-6">
                  {selectedProject.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4">
                      <img src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.name}`} className="size-10 rounded-full" alt="" />
                      <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-black text-sm">{comment.author.name}</p>
                          <span className="text-[10px] text-gray-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Styles for Quill Dark Mode */}
      <style>{`
        .ql-container { font-family: inherit; font-size: 1rem; border-color: transparent !important; }
        .ql-toolbar { border-color: transparent !important; background: #f9fafb; border-bottom: 1px solid #e5e7eb !important; border-radius: 1.5rem 1.5rem 0 0; }
        .dark .ql-toolbar { background: #1f2937; border-bottom-color: #374151 !important; color: white; }
        .dark .ql-stroke { stroke: #9ca3af !important; }
        .dark .ql-fill { fill: #9ca3af !important; }
        .dark .ql-picker { color: #9ca3af !important; }
        .ql-editor { min-height: 250px; }
        .ql-editor.ql-blank::before { color: #9ca3af !important; font-style: normal; font-weight: 500; }
      `}</style>
    </div>
  );
};

export default ProjectsPage;
