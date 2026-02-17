
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo routing: simulate admin if input matches 'admin'
    const input = (e.target as any).elements[0].value;
    if (input.toLowerCase() === 'admin') {
      navigate('/admin');
    } else {
      navigate('/feed');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${IMAGES.LOGIN_BG})` }}
        />
        <div className="relative z-10 flex flex-col justify-center px-24 text-white">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl inline-block mb-10 w-fit">
             <span className="material-symbols-outlined text-5xl font-fill-1">auto_awesome</span>
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight mb-6">
            Conectando a Educação em Campina Grande
          </h1>
          <p className="text-xl font-light opacity-90 max-w-lg mb-12">
            A plataforma oficial de colaboração entre professores e alunos da rede municipal. Juntos, transformamos o futuro da nossa cidade.
          </p>
          <div className="flex gap-4 items-center">
            <div className="flex -space-x-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="size-11 rounded-full border-2 border-primary bg-gray-200 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/100?random=${i})` }} />
              ))}
            </div>
            <p className="text-sm font-medium">+ de 50.000 usuários ativos</p>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 text-primary">
            <span className="material-symbols-outlined text-4xl font-fill-1">auto_awesome</span>
            <h2 className="text-2xl font-black">EduConnect CG</h2>
          </div>
          
          <header className="mb-12">
            <div className="hidden lg:flex items-center gap-2 text-primary mb-8">
              <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
              <h2 className="text-xl font-bold">EduConnect CG</h2>
            </div>
            <h1 className="text-3xl font-black text-[#0d121b] mb-2">Acesse sua conta</h1>
            <p className="text-gray-500">Entre com suas credenciais da rede municipal.</p>
          </header>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">CPF ou Matrícula</label>
              <input 
                required
                className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl focus:ring-primary px-4 outline-none transition-all focus:bg-white border-2 focus:border-primary/20"
                placeholder="000.000.000-00 ou 123456"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-700">Senha</label>
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full h-14 bg-gray-50 border-gray-200 rounded-xl focus:ring-primary pl-4 pr-12 outline-none transition-all focus:bg-white border-2 focus:border-primary/20"
                  placeholder="Sua senha de acesso"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded text-primary focus:ring-primary border-gray-300 size-4" />
              <label htmlFor="remember" className="text-sm text-gray-600">Lembrar de mim</label>
            </div>

            <button 
              type="submit"
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Entrar
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-gray-100">
            <p className="text-gray-600">
              Novo na rede municipal? 
              <button 
                onClick={() => navigate('/profile-selection')}
                className="text-primary font-bold hover:underline ml-1"
              >
                Primeiro acesso
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
