import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, setAuthToken, getMediaUrl } from '../api';
import { useSettings } from '../contexts/SettingsContext';
import { IMAGES } from '../constants';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const tokenFromUrl = searchParams.get('token') || searchParams.get('sso_token');
  const { settings } = useSettings();

  // Mode: Staff (Email/Password or Portal SSO) vs Student (Matrícula + Código da Turma)
  const [loginMode, setLoginMode] = useState<'STAFF' | 'STUDENT'>('STAFF');

  // Staff Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student Login state
  const [registration, setRegistration] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle SSO Token from URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleSSOLogin(tokenFromUrl);
    } else {
      // Auto-login redirect if existing token exists
      const localToken = localStorage.getItem('token');
      if (localToken) {
        const target = redirectPath || '/feed';
        navigate(target, { replace: true });
      }
    }
  }, [navigate, redirectPath, tokenFromUrl]);

  const handleSSOLogin = async (ssoToken: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.validateSSO(ssoToken);
      if (response.token && response.user) {
        setAuthToken(response.token);
        const userRole = response.user?.role?.toUpperCase();
        navigate(userRole === 'ADMIN' ? '/admin' : (redirectPath || '/feed'));
      }
    } catch (err: any) {
      setError('Falha na autenticação via Portal: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });

      if (response.token && response.user) {
        setAuthToken(response.token);
        const userRole = response.user?.role?.toUpperCase();
        if (userRole === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate(redirectPath || '/feed');
        }
      } else {
        setError(response.message || 'Erro ao fazer login');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.studentLogin({
        registration: registration.trim(),
        accessCode: accessCode.trim().toUpperCase()
      });

      if (response.token && response.user) {
        setAuthToken(response.token);
        navigate(redirectPath || '/feed');
      } else {
        setError(response.message || 'Erro ao validar acesso do estudante');
      }
    } catch (err: any) {
      setError(err.message || 'Matrícula ou código de acesso da turma incorreto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${IMAGES.LOGIN_BG})` }}
        />
        <div className="relative z-10 flex flex-col justify-center px-24 text-white">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl inline-block mb-10 w-fit">
            {settings.LOGO_URL ? (
              <img src={getMediaUrl(settings.LOGO_URL)} alt="Logo" className="h-12 w-auto object-contain brightness-0 invert" />
            ) : (
              <span className="material-symbols-outlined text-5xl font-fill-1">auto_awesome</span>
            )}
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight mb-6">
            Conectando a Educação em {settings.APP_NAME?.replace('EduConnect ', '') || 'Campina Grande'}
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
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 py-16 dark:bg-gray-950 transition-colors duration-300">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 text-primary">
            {settings.LOGO_URL ? (
              <img src={getMediaUrl(settings.LOGO_URL)} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <span className="material-symbols-outlined text-4xl font-fill-1">auto_awesome</span>
            )}
            <h2 className="text-2xl font-black">{settings.APP_NAME || 'EduConnect CG'}</h2>
          </div>

          <header className="mb-8">
            <div className="hidden lg:flex items-center gap-2 text-primary mb-6">
              {settings.LOGO_URL ? (
                <img src={settings.LOGO_URL} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <span className="material-symbols-outlined text-3xl font-fill-1">auto_awesome</span>
              )}
              <h2 className="text-xl font-bold">{settings.APP_NAME || 'EduConnect CG'}</h2>
            </div>
            <h1 className="text-3xl font-black text-[#0d121b] dark:text-gray-100 mb-2">Acesse sua conta</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {loginMode === 'STAFF' 
                ? 'Entre com suas credenciais de servidor ou Portal EduCampina.' 
                : 'Acesse sua turma usando sua matrícula e o código fornecido pelo professor.'}
            </p>
          </header>

          {/* Mode Selector Tab */}
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl mb-8 border border-gray-200/60 dark:border-gray-800">
            <button
              type="button"
              onClick={() => { setLoginMode('STAFF'); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                loginMode === 'STAFF'
                  ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              Professor / Gestor
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('STUDENT'); setError(''); }}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                loginMode === 'STUDENT'
                  ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">school</span>
              Estudante (Turma)
            </button>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-3">
              <span className="material-symbols-outlined text-xl shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* STUDENT LOGIN FORM */}
          {loginMode === 'STUDENT' && (
            <form className="space-y-6" onSubmit={handleStudentLogin}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Matrícula do Aluno</span>
                  <span className="text-[11px] text-gray-400 font-normal">Disponível no boletim</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">id_card</span>
                  <input
                    type="text"
                    required
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value)}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-primary pl-12 pr-4 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 border-2 focus:border-primary/20 disabled:opacity-50 font-medium"
                    placeholder="Ex: 2024090123"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Código de Acesso da Turma</span>
                  <span className="text-[11px] text-primary font-bold">Fornecido pelo professor</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">key</span>
                  <input
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-primary pl-12 pr-4 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 border-2 focus:border-primary/20 disabled:opacity-50 uppercase tracking-widest font-black text-center text-lg"
                    placeholder="EDU-XXX"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 text-xs text-primary dark:text-primary/90 leading-relaxed flex items-start gap-3">
                <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">info</span>
                <span>
                  O código da turma é gerado pelo seu professor no <strong>EduCampina</strong>. Se você ainda não tem o código, solicite em sala de aula!
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:cursor-not-allowed"
              >
                {loading ? 'Validando acesso...' : 'Entrar na Turma'}
                {!loading && <span className="material-symbols-outlined">school</span>}
              </button>
            </form>
          )}

          {/* STAFF LOGIN FORM */}
          {loginMode === 'STAFF' && (
            <form className="space-y-6" onSubmit={handleStaffLogin}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Institucional</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-primary px-4 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 border-2 focus:border-primary/20 disabled:opacity-50"
                  placeholder="seu.email@educonnect.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Senha</label>
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-primary pl-4 pr-12 outline-none transition-all focus:bg-white dark:focus:bg-gray-800 border-2 focus:border-primary/20 disabled:opacity-50"
                    placeholder="Sua senha de acesso"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:cursor-not-allowed"
              >
                {loading ? 'Conectando...' : 'Entrar com Email'}
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-950 px-2 text-gray-400 font-bold tracking-widest">Ou acesse com</span>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  const portalUrl = import.meta.env.VITE_PORTAL_URL || 'https://portaleducampina.com.br';
                  window.location.href = `${portalUrl}/login/external?redirect=${window.location.origin}/login`;
                }}
                className="w-full h-14 bg-white dark:bg-gray-900 border-2 border-primary/20 hover:border-primary/50 text-primary font-bold rounded-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined font-fill-1 text-2xl">account_balance</span>
                Entrar com Portal EduCampina
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
