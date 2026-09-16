import React, { useState, useEffect, useCallback } from 'react';
import { auditAPI } from '../api';
import { AuditLog } from '../types';
import { useModal } from '../contexts/ModalContext';

export const AdminAuditLogsPage: React.FC = () => {
  const { showModal } = useModal();

  // Data state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modals state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  // Export Modal Form
  const [exportPeriod, setExportPeriod] = useState<'3m' | '6m' | 'all'>('3m');
  const [purgeAfterExport, setPurgeAfterExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Purge Modal Form
  const [purgeMonths, setPurgeMonths] = useState<number>(3);
  const [isPurging, setIsPurging] = useState(false);

  // Fetch stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await auditAPI.getStats();
      setStats(res);
    } catch (err) {
      console.error('Falha ao carregar métricas de auditoria:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditAPI.getLogs({
        page,
        limit,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });

      setLogs(res.logs || []);
      setTotalPages(res.pagination?.totalPages || res.pagination?.pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Falha ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, categoryFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setStatusFilter('');
    setSearchTerm('');
    setSearchInput('');
    setPage(1);
  };

  // Handle CSV Export
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const filename = await auditAPI.exportCSV({
        period: exportPeriod,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });

      // If purge after export requested
      if (purgeAfterExport && (exportPeriod === '3m' || exportPeriod === '6m')) {
        const months = exportPeriod === '3m' ? 3 : 6;
        const purgeRes = await auditAPI.purgeLogs(months);
        showModal({
          title: 'Exportação e Limpeza Concluídas',
          message: `Arquivo ${filename} baixado com sucesso! ${purgeRes.count} logs com mais de ${months} meses foram excluídos do servidor para liberar espaço em disco.`,
          type: 'success',
        });
        fetchStats();
        fetchLogs();
      } else {
        showModal({
          title: 'Exportação Concluída',
          message: `Arquivo CSV baixado com sucesso (${filename}).`,
          type: 'success',
        });
      }

      setIsExportModalOpen(false);
      setPurgeAfterExport(false);
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      showModal({
        title: 'Erro na Exportação',
        message: err.message || 'Não foi possível gerar o arquivo CSV de auditoria.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Direct Purge
  const handleDirectPurge = async () => {
    try {
      setIsPurging(true);
      const res = await auditAPI.purgeLogs(purgeMonths);
      showModal({
        title: 'Limpeza Realizada com Sucesso',
        message: `${res.count} logs de auditoria anteriores a ${purgeMonths} meses foram permanentemente removidos. O espaço em disco na VPS foi otimizado.`,
        type: 'success',
      });
      setIsPurgeModalOpen(false);
      fetchStats();
      fetchLogs();
    } catch (err: any) {
      console.error('Erro ao purgar logs:', err);
      showModal({
        title: 'Falha na Limpeza',
        message: err.message || 'Ocorreu um erro ao tentar excluir os logs antigos.',
        type: 'error',
      });
    } finally {
      setIsPurging(false);
    }
  };

  // Helper Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCESSO':
      case 'APROVADO':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'FALHA':
      case 'REPROVADO':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'PENDENTE':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'ACESSO':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'POSTAGEM':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'MODERACAO':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'SISTEMA':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      case 'USUARIO':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const formatActionName = (action: string) => {
    const map: Record<string, string> = {
      STUDENT_LOGIN_SUCCESS: 'Acesso de Aluno',
      STUDENT_LOGIN_NOT_FOUND: 'Falha: Matrícula Inexistente',
      STUDENT_LOGIN_INVALID_CLASS: 'Falha: Código de Turma Inválido',
      PORTAL_VERIFY_SUCCESS: 'Login SSO EduCampina',
      LOGIN_SUCCESS: 'Login Direto',
      LOGIN_FAILED_CREDENTIALS: 'Falha: Senha Incorreta',
      LOGIN_FAILED_NOT_FOUND: 'Falha: Usuário Inexistente',
      POST_CREATED_PENDING: 'Post Aluno (Aguardando Moderação)',
      POST_CREATED_PUBLISHED: 'Post Publicado Diretamente',
      POST_UPDATED: 'Post Atualizado',
      POST_DELETED: 'Post Excluído',
      POST_APPROVED: 'Post Aprovado na Moderação',
      POST_REJECTED: 'Post Reprovado na Moderação',
      AUDIT_LOGS_PURGED: 'Expurgo Manual de Logs',
    };
    return map[action] || action;
  };

  return (
    <div className="animate-fade-in pb-16">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <span className="material-symbols-outlined text-2xl">receipt_long</span>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic dark:text-gray-100">
                Logs de Auditoria
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Rastreabilidade e governança de acessos, postagens, moderações e segurança do sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto">
          <button
            onClick={() => {
              fetchStats();
              fetchLogs();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Atualizar
          </button>

          <button
            onClick={() => setIsPurgeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">auto_delete</span>
            Limpeza de Disco
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Exportar CSV
          </button>
        </div>
      </header>

      {/* Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl material-symbols-outlined text-2xl">
              dataset
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
              Total Geral
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Eventos Registrados
            </p>
            <p className="text-3xl font-black text-[#0d121b] dark:text-white">
              {statsLoading ? '...' : (stats?.total || 0).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl material-symbols-outlined text-2xl">
              login
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              {statsLoading ? '...' : `${stats?.successCount || 0} êxitos`}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Tentativas de Acesso
            </p>
            <p className="text-3xl font-black text-[#0d121b] dark:text-white">
              {statsLoading ? '...' : (stats?.accessCount || 0).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl material-symbols-outlined text-2xl">
              post_add
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
              {statsLoading ? '...' : `${stats?.pendingCount || 0} pendentes`}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Publicações Monitoradas
            </p>
            <p className="text-3xl font-black text-[#0d121b] dark:text-white">
              {statsLoading ? '...' : (stats?.postCount || 0).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl material-symbols-outlined text-2xl">
              verified
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              {statsLoading ? '...' : `${stats?.approvedCount || 0} aprovadas`}
            </span>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Ações de Moderação
            </p>
            <p className="text-3xl font-black text-[#0d121b] dark:text-white">
              {statsLoading ? '...' : (stats?.moderationCount || 0).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por usuário, matrícula, ação, IP ou detalhes..."
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-gray-200 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-gray-200 transition-all cursor-pointer font-medium"
            >
              <option value="">Todas Categorias</option>
              <option value="ACESSO">Acesso & Logins</option>
              <option value="POSTAGEM">Postagens</option>
              <option value="MODERACAO">Moderação</option>
              <option value="SISTEMA">Sistema & VPS</option>
              <option value="USUARIO">Usuários</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:text-gray-200 transition-all cursor-pointer font-medium"
            >
              <option value="">Todos Status</option>
              <option value="SUCESSO">Sucesso</option>
              <option value="FALHA">Falha</option>
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADO">Aprovado</option>
              <option value="REPROVADO">Reprovado</option>
            </select>
          </div>

          {/* Submit Search & Reset Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button
              type="submit"
              className="flex-1 lg:flex-none px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
            >
              Filtrar
            </button>
            {(categoryFilter || statusFilter || searchTerm) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-3 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-2xl transition-all"
                title="Limpar filtros"
              >
                <span className="material-symbols-outlined text-xl">filter_alt_off</span>
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Logs Table */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight dark:text-gray-100">
              Registros Auditáveis
            </h2>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mt-0.5">
              Exibindo {logs.length} de {totalCount.toLocaleString('pt-BR')} registros
            </p>
          </div>

          {/* Rows per page selector */}
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <span>Linhas por página:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1 text-xs dark:text-gray-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Categoria & Evento</th>
                <th className="px-6 py-4">Usuário / Identificação</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">IP / Origem</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 dark:text-gray-600 font-black uppercase tracking-widest text-xs animate-pulse">
                    Carregando registros de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <span className="material-symbols-outlined text-5xl">fact_check</span>
                      <p className="text-sm font-black uppercase tracking-widest">
                        Nenhum registro encontrado para os filtros selecionados.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0d121b] dark:text-gray-200">
                          {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Category & Action */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getCategoryBadge(
                              log.category
                            )}`}
                          >
                            {log.category}
                          </span>
                        </div>
                        <span className="font-bold text-[#0d121b] dark:text-gray-200">
                          {formatActionName(log.action)}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                          {log.userName ? log.userName[0].toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0d121b] dark:text-gray-200 truncate">
                              {log.userName || 'Anônimo / Visitante'}
                            </span>
                            {log.userRole && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
                                {log.userRole}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {log.registration && (
                              <span className="font-mono text-[11px]">Matr: {log.registration}</span>
                            )}
                            {log.className && <span>• {log.className}</span>}
                            {log.schoolName && <span className="truncate max-w-[150px]">• {log.schoolName}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        <span className="size-1.5 rounded-full bg-current"></span>
                        {log.status}
                      </span>
                    </td>

                    {/* IP */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2.5 py-1 rounded-lg">
                        {log.ipAddress || '127.0.0.1'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Inspecionar Detalhes"
                      >
                        <span className="material-symbols-outlined text-xl">info</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-400 font-medium">
            Página <span className="font-bold text-[#0d121b] dark:text-gray-200">{page}</span> de{' '}
            <span className="font-bold text-[#0d121b] dark:text-gray-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Anterior
            </button>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              Próxima
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Export CSV */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-8 border border-gray-100 dark:border-gray-800 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <span className="material-symbols-outlined text-2xl">file_download</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight dark:text-gray-100">
                    Exportar Logs em CSV
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Compatível nativamente com Microsoft Excel e auditorias.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Period Selection */}
            <div className="space-y-3 mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
                Selecione o Intervalo de Auditoria:
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  exportPeriod === '3m'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportPeriod"
                  checked={exportPeriod === '3m'}
                  onChange={() => setExportPeriod('3m')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">📅 Últimos 3 Meses (Trimestral)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recomendado para rotinas periódicas de conformidade.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  exportPeriod === '6m'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportPeriod"
                  checked={exportPeriod === '6m'}
                  onChange={() => setExportPeriod('6m')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">📅 Últimos 6 Meses (Semestral)</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ideal para encerramento de semestres letivos e prestação de contas.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  exportPeriod === 'all'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportPeriod"
                  checked={exportPeriod === 'all'}
                  onChange={() => setExportPeriod('all')}
                  className="mt-1"
                />
                <div>
                  <p className="font-bold text-sm">📦 Todo o Histórico Disponível</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Exporta todos os logs registrados desde o início.
                  </p>
                </div>
              </label>
            </div>

            {/* Purge Checkbox Option */}
            {exportPeriod !== 'all' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={purgeAfterExport}
                    onChange={(e) => setPurgeAfterExport(e.target.checked)}
                    className="mt-1 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                      Excluir logs exportados do servidor após o download
                    </span>
                    <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 block">
                      Evita acúmulo excessivo e libera espaço no banco de dados e disco da VPS. Apenas os logs do período selecionado serão expurgados.
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                disabled={isExporting}
                className="px-5 py-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-base ${isExporting ? 'animate-spin' : ''}`}>
                  {isExporting ? 'sync' : 'download'}
                </span>
                {isExporting ? 'Exportando...' : 'Baixar Arquivo CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direct Purge */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-800 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight dark:text-gray-100">
                Limpeza de Logs Antigos
              </h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Esta ação excluirá permanentemente os registros de auditoria mais antigos do banco de dados para evitar o esgotamento do armazenamento na VPS.
            </p>

            <div className="space-y-3 mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">
                Excluir registros com mais de:
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  purgeMonths === 3
                    ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="purgeMonths"
                  checked={purgeMonths === 3}
                  onChange={() => setPurgeMonths(3)}
                />
                <span>Mais de 3 meses (90 dias)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  purgeMonths === 6
                    ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="purgeMonths"
                  checked={purgeMonths === 6}
                  onChange={() => setPurgeMonths(6)}
                />
                <span>Mais de 6 meses (180 dias)</span>
              </label>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-medium mb-6">
              ⚠️ Certifique-se de ter feito o download prévio do CSV se precisar manter os registros para fins fiscais ou legais.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurging}
                className="px-5 py-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDirectPurge}
                disabled={isPurging}
                className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-base ${isPurging ? 'animate-spin' : ''}`}>
                  {isPurging ? 'sync' : 'delete_forever'}
                </span>
                {isPurging ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full p-8 border border-gray-100 dark:border-gray-800 shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getCategoryBadge(
                    selectedLog.category
                  )}`}
                >
                  {selectedLog.category}
                </span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getStatusBadge(
                    selectedLog.status
                  )}`}
                >
                  {selectedLog.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 flex-1 pr-2 custom-scrollbar">
              <div>
                <h3 className="text-xl font-black dark:text-white">
                  {formatActionName(selectedLog.action)}
                </h3>
                <p className="text-xs font-mono text-gray-400 mt-1">Código: {selectedLog.action}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Registrado em:{' '}
                  <span className="font-bold">
                    {new Date(selectedLog.createdAt).toLocaleString('pt-BR')}
                  </span>
                </p>
              </div>

              {/* Grid of metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
                <div>
                  <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">
                    Usuário Identificado
                  </span>
                  <p className="font-bold text-sm text-[#0d121b] dark:text-gray-200">
                    {selectedLog.userName || 'Não identificado'}
                  </p>
                  {selectedLog.userEmail && <p className="text-gray-400">{selectedLog.userEmail}</p>}
                  {selectedLog.userRole && (
                    <span className="inline-block mt-1 font-black px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px]">
                      {selectedLog.userRole}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">
                    Vínculo Escolar / Turma
                  </span>
                  <p className="font-bold text-sm text-[#0d121b] dark:text-gray-200">
                    {selectedLog.schoolName || 'Não vinculada'}
                  </p>
                  {selectedLog.className && <p className="text-gray-400">Turma: {selectedLog.className}</p>}
                  {selectedLog.registration && (
                    <p className="text-gray-400 font-mono">Matrícula: {selectedLog.registration}</p>
                  )}
                </div>

                <div>
                  <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">
                    Endereço IP (Origem)
                  </span>
                  <p className="font-mono text-sm text-[#0d121b] dark:text-gray-200 font-bold">
                    {selectedLog.ipAddress || 'Não registrado'}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">
                    Objeto Alvo (Target)
                  </span>
                  <p className="font-mono text-xs text-[#0d121b] dark:text-gray-200">
                    {selectedLog.targetType ? `${selectedLog.targetType}: ` : ''}
                    {selectedLog.targetId || 'Nenhum'}
                  </p>
                </div>

                {selectedLog.userAgent && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">
                      User Agent do Navegador
                    </span>
                    <p className="font-mono text-[11px] text-gray-500 break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>

              {/* Details Payload */}
              {selectedLog.details && (
                <div>
                  <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-2">
                    Carga Útil de Detalhes (JSON):
                  </span>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-2xl text-xs font-mono overflow-x-auto border border-gray-800 custom-scrollbar max-h-60">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch {
                        return selectedLog.details;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
