import React, { useState, useEffect } from 'react';
import { ModerationItem } from '../types';
import { moderationAPI, getMediaUrl } from '../api';
import { useModal } from '../contexts/ModalContext';
import { Header } from '../components/Header';

export const TeacherModerationPage: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<{ pending: number; approved: number; rejected: number; total: number }>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDENTES' | 'HISTORICO'>('PENDENTES');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Rejection Modal State
  const [rejectingItem, setRejectingItem] = useState<ModerationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { showModal } = useModal();

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsData, statsData] = await Promise.all([
        moderationAPI.getItems(),
        moderationAPI.getStats()
      ]);

      const formatted = itemsData.map((item: any) => ({
        id: item.id,
        postId: item.postId,
        author: item.post?.author?.name || 'Estudante',
        authorId: item.post?.author?.id,
        authorAvatar: item.post?.author?.avatar,
        authorRole: item.post?.author?.role,
        school: item.post?.author?.school || 'Escola Municipal',
        className: item.post?.className || item.post?.author?.className || 'Turma não informada',
        registration: item.post?.author?.registration || 'S/M',
        date: new Date(item.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        contentPreview: item.post?.content || '',
        images: item.post?.images || (item.post?.image ? [item.post?.image] : []),
        status: item.status,
        reason: item.reason,
        moderatorName: item.moderator?.name || null,
        updatedAt: item.updatedAt
      }));

      setItems(formatted);
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Falha ao carregar itens de moderação:', error);
      showModal({
        title: 'Erro ao Carregar',
        message: 'Não foi possível carregar as publicações dos alunos para moderação.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (item: ModerationItem) => {
    setActionLoading(true);
    try {
      await moderationAPI.approveItem(item.id);
      showModal({
        title: 'Publicação Aprovada!',
        message: `O post de ${item.author} foi aprovado com sucesso e já está disponível no feed.`,
        type: 'success'
      });
      loadData();
    } catch (error: any) {
      showModal({
        title: 'Erro ao Aprovar',
        message: error.message || 'Não foi possível aprovar a publicação.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (item: ModerationItem) => {
    setRejectingItem(item);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      showModal({
        title: 'Justificativa Obrigatória',
        message: 'Por favor, informe a justificativa ou orientação pedagógica para o aluno.',
        type: 'error'
      });
      return;
    }

    setActionLoading(true);
    try {
      await moderationAPI.rejectItem(rejectingItem.id, {
        reason: rejectReason.trim(),
        deletePost: false
      });
      showModal({
        title: 'Publicação Rejeitada',
        message: `A orientação pedagógica foi enviada para ${rejectingItem.author}.`,
        type: 'info'
      });
      setRejectingItem(null);
      loadData();
    } catch (error: any) {
      showModal({
        title: 'Erro ao Rejeitar',
        message: error.message || 'Não foi possível registrar a decisão.',
        type: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'PENDENTES' && item.status !== 'PENDENTE') return false;
    if (activeTab === 'HISTORICO' && item.status === 'PENDENTE') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAuthor = item.author.toLowerCase().includes(q);
      const matchClass = item.className?.toLowerCase().includes(q);
      const matchReg = item.registration?.toLowerCase().includes(q);
      const matchContent = item.contentPreview.toLowerCase().includes(q);
      return matchAuthor || matchClass || matchReg || matchContent;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Header activeTab="home" onLogout={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-primary text-3xl">verified_user</span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Moderação Pedagógica
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Espaço seguro de aprovação e auditoria de publicações criadas pelos estudantes de suas turmas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary transition-all flex items-center gap-2 shadow-sm"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
              Atualizar Fila
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                Aguardando Aprovação
              </p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.pending}</h3>
            </div>
            <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                Aprovadas & Públicas
              </p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.approved}</h3>
            </div>
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
                Devolvidas / Rejeitadas
              </p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.rejected}</h3>
            </div>
            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
          </div>
        </div>

        {/* Tab & Search Filter Bar */}
        <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('PENDENTES')}
              className={`flex-1 md:flex-none px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'PENDENTES'
                  ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Pendentes</span>
              {stats.pending > 0 && (
                <span className="size-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('HISTORICO')}
              className={`flex-1 md:flex-none px-6 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'HISTORICO'
                  ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Histórico & Auditoria</span>
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aluno, matrícula ou turma..."
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ring-primary/20"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800 shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 animate-spin">progress_activity</span>
            <p className="text-sm font-bold text-gray-500">Carregando fila pedagógica...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-1">
              {activeTab === 'PENDENTES' ? 'Fila Limpa! Nenhuma publicação pendente.' : 'Nenhum registro de moderação encontrado.'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {activeTab === 'PENDENTES'
                ? 'Novas postagens feitas por estudantes vinculados à sua turma aparecerão aqui para sua aprovação prévia.'
                : 'O histórico de decisões e auditoria das postagens analisadas será arquivado aqui.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-11 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm uppercase bg-cover bg-center border border-gray-200 dark:border-gray-800 shrink-0"
                      style={item.authorAvatar ? { backgroundImage: `url(${getMediaUrl(item.authorAvatar)})` } : {}}
                    >
                      {!item.authorAvatar && item.author.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 dark:text-gray-100 text-base">{item.author}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase">
                          {item.className}
                        </span>
                        {item.registration && (
                          <span className="text-[11px] text-gray-400 font-mono">
                            Mat: {item.registration}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.school} • Submetido em {item.date}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'PENDENTE' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800">
                        <span className="size-2 rounded-full bg-amber-500 animate-ping"></span>
                        Aguardando Aprovação
                      </span>
                    )}
                    {item.status === 'APROVADO' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                        <span className="material-symbols-outlined text-sm font-fill-1">check</span>
                        Aprovado por {item.moderatorName || 'Professor'}
                      </span>
                    )}
                    {item.status === 'REPROVADO' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800">
                        <span className="material-symbols-outlined text-sm">close</span>
                        Rejeitado
                      </span>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="py-4">
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line font-normal">
                    {item.contentPreview || <span className="italic text-gray-400">Publicação sem texto (somente mídia)</span>}
                  </p>

                  {/* Images Gallery Preview */}
                  {item.images && item.images.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {item.images.map((imgUrl: string, idx: number) => (
                        <a
                          key={idx}
                          href={getMediaUrl(imgUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="size-24 rounded-xl bg-gray-100 dark:bg-gray-800 bg-cover bg-center shrink-0 border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
                          style={{ backgroundImage: `url(${getMediaUrl(imgUrl)})` }}
                        />
                      ))}
                    </div>
                  )}

                  {item.reason && item.status === 'REPROVADO' && (
                    <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300">
                      <strong>Orientação ao Aluno:</strong> {item.reason}
                    </div>
                  )}
                </div>

                {/* Actions (Only in Pending mode) */}
                {item.status === 'PENDENTE' && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-end gap-3">
                    <button
                      onClick={() => handleOpenReject(item)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">block</span>
                      Recusar com Justificativa
                    </button>

                    <button
                      onClick={() => handleApprove(item)}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Aprovar Publicação
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <span className="material-symbols-outlined text-2xl">feedback</span>
                <h3 className="text-lg font-black">Orientação Pedagógica</h3>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Explique a <strong>{rejectingItem.author}</strong> o motivo pelo qual a publicação não foi aprovada. Essa mensagem será enviada como notificação pedagógica ao aluno.
            </p>

            {/* Quick Presets */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-2">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Por favor, revise o texto e ortografia.',
                  'Atenção às diretrizes de respeito no ambiente escolar.',
                  'A imagem não está clara ou não é pertinente à atividade.',
                  'Conteúdo inadequado para o mural escolar.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-[11px] px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 hover:text-primary rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Mensagem de Orientação:</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Escreva orientações claras e construtivas para o estudante..."
                className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ring-primary/20 resize-none font-medium"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                {actionLoading ? 'Registrando...' : 'Confirmar e Notificar Aluno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherModerationPage;
