
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';
import { authAPI, setAuthToken } from '../api';

const RegistrationPage: React.FC = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    phone: '',
  });

  const title = role === 'aluno' ? 'Crie sua conta de Aluno' : 'Cadastro de Professor';
  const icon = role === 'aluno' ? 'person' : 'school';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: (role as 'ALUNO' | 'PROFESSOR' | 'ADMIN') || 'ALUNO'
      });

      if (response.token && response.user) {
        setAuthToken(response.token);
        navigate('/feed');
      } else {
        setError(response.message || 'Erro ao registrar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
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
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <section>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700">Nome Completo</label>
                  <input 
                    required 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 border-2 disabled:opacity-50" 
                    placeholder="Ex: Maria José da Silva" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Email</label>
                  <input 
                    required 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 border-2 disabled:opacity-50" 
                    placeholder="seu.email@educonnect.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">CPF</label>
                  <input 
                    required 
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 border-2 disabled:opacity-50" 
                    placeholder="000.000.000-00" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Telefone</label>
                  <input 
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 border-2 disabled:opacity-50" 
                    placeholder="(83) 90000-0000" 
                  />
                </div>
              </div>
            </section>

            <section className="pt-10 border-t">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                Segurança
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Senha</label>
                  <input 
                    required 
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 border-2 disabled:opacity-50" 
                    placeholder="Sua senha segura" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Confirmar Senha</label>
                  <input 
                    required 
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl px-4 border-2 disabled:opacity-50" 
                    placeholder="Confirme sua senha" 
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between pt-10 border-t">
              <p className="text-xs text-gray-400 max-w-sm text-center md:text-left">
                Ao continuar, você concorda com nossos <a className="text-primary hover:underline" href="#">Termos de Uso</a> e <a className="text-primary hover:underline" href="#">Política de Privacidade</a>.
              </p>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="px-8 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 md:flex-none px-12 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : 'Continuar'}
                  {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
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
