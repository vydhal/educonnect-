
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../constants';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simula o envio de email
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Progress Bar (Decoration) */}
        <div className="h-2 bg-gray-100 w-full overflow-hidden">
          <div className={`h-full bg-primary transition-all duration-1000 ${isSubmitted ? 'w-full' : 'w-1/3'}`}></div>
        </div>

        <div className="p-10">
          <div className="flex items-center gap-3 text-primary mb-10 justify-center">
            <span className="material-symbols-outlined text-4xl font-fill-1">auto_awesome</span>
            <h2 className="text-2xl font-black">EduConnect CG</h2>
          </div>

          {!isSubmitted ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="text-center mb-8">
                <h1 className="text-2xl font-black text-gray-800 mb-2">Recuperar Senha</h1>
                <p className="text-sm text-gray-500">
                  Esqueceu sua senha? Não se preocupe! Insira seu CPF ou e-mail institucional para receber as instruções.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">E-mail ou CPF</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">alternate_email</span>
                    <input 
                      required
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 bg-gray-50 border-gray-100 border-2 rounded-2xl pl-12 pr-4 focus:ring-primary focus:border-primary/20 outline-none transition-all focus:bg-white"
                      placeholder="Ex: maria@edu.cg.gov.br"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                >
                  {isLoading ? (
                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                  ) : (
                    <>
                      Enviar Instruções
                      <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Voltar para o login
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center animate-in zoom-in duration-500">
              <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">mark_email_read</span>
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Verifique seu e-mail</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                As instruções de recuperação foram enviadas para o endereço associado à conta. Se não encontrar, verifique a pasta de spam.
              </p>
              
              <button 
                onClick={() => navigate('/login')}
                className="w-full h-14 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">login</span>
                Voltar para o Login
              </button>

              <p className="mt-8 text-xs text-gray-400">
                Não recebeu o código? <button onClick={() => setIsSubmitted(false)} className="text-primary font-bold hover:underline">Tente novamente</button>
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 opacity-40 grayscale flex items-center gap-4">
        <img src={IMAGES.PREFEITURA_LOGO} className="h-10" alt="Prefeitura" />
        <div className="h-6 w-px bg-gray-400"></div>
        <div className="text-left font-bold uppercase text-[8px] leading-tight">
          Secretaria de<br/>Educação
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
