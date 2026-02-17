
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';

const RegistrationPage: React.FC = () => {
  const { role } = useParams();
  const navigate = useNavigate();

  const title = role === 'aluno' ? 'Crie sua conta de Aluno' : 'Cadastro de Professor';
  const icon = role === 'aluno' ? 'person' : 'school';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/feed');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-10 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 text-primary">
          <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
          <h2 className="text-xl font-bold">EduConnect CG</h2>
        </div>
        <div className="flex gap-8 items-center text-sm font-medium">
          <button className="hover:text-primary">Sobre o Projeto</button>
          <button className="hover:text-primary">Ajuda</button>
          <button onClick={() => navigate('/login')} className="text-primary font-bold">Já tenho conta</button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-12 w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-3">{title}</h1>
          <p className="text-gray-500 text-lg">Conecte-se com sua rede educacional em Campina Grande.</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#cfd7e7] shadow-xl overflow-hidden">
          {/* Progress */}
          <div className="p-8 border-b bg-gray-50/50">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-primary text-xs font-bold uppercase tracking-widest mb-1">Passo 1 de 2</p>
                <p className="text-lg font-bold">Dados Principais</p>
              </div>
              <p className="text-primary font-black">50%</p>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200">
              <div className="w-1/2 h-full rounded-full bg-primary"></div>
            </div>
            <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Suas informações serão validadas com o banco de dados municipal.
            </p>
          </div>

          <form className="p-10 space-y-10" onSubmit={handleSubmit}>
            <section>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                  <input required className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4" placeholder="Ex: Maria José da Silva" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Matrícula</label>
                  <input required className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4" placeholder="000000-0" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Data de Nascimento</label>
                  <input required type="date" className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700">Unidade Escolar</label>
                  <select className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 appearance-none">
                    <option value="">Selecione sua escola</option>
                    <option>EMEF Raul Córdula</option>
                    <option>EMEF Dr. Elpídio de Almeida</option>
                    <option>EMEF Anísio Teixeira</option>
                  </select>
                </div>
              </div>
            </section>

            {role === 'aluno' && (
              <section className="pt-10 border-t">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">family_restroom</span>
                  Dados do Responsável
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700">Nome do Responsável</label>
                    <input className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4" placeholder="Nome do pai, mãe ou tutor legal" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Telefone</label>
                    <input className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4" placeholder="(83) 90000-0000" />
                  </div>
                </div>
              </section>
            )}

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between pt-10 border-t">
              <p className="text-xs text-gray-400 max-w-sm text-center md:text-left">
                Ao continuar, você concorda com nossos <a className="text-primary hover:underline" href="#">Termos de Uso</a> e <a className="text-primary hover:underline" href="#">Política de Privacidade</a>.
              </p>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-8 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  className="flex-1 md:flex-none px-12 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Continuar
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <footer className="mt-16 text-center space-y-8">
          <p className="text-sm text-gray-400">
            Dificuldades? <a href="#" className="text-primary font-bold hover:underline">Fale com o suporte técnico</a>
          </p>
          <div className="flex justify-center items-center gap-4 opacity-40 grayscale">
            <img src={IMAGES.PREFEITURA_LOGO} className="h-12" alt="Prefeitura" />
            <div className="h-8 w-px bg-gray-400"></div>
            <div className="text-left font-bold uppercase text-[10px] leading-tight">
              Secretaria de<br/>Educação
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default RegistrationPage;
