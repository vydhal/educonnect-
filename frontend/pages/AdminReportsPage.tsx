
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area,
    PieChart, Pie
} from 'recharts';

// --- UI Components (Shadcn-like local components) ---

const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, subtitle?: string }> = ({ children, className = "", title, subtitle }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col ${className}`}>
        {(title || subtitle) && (
            <div className="p-6 pb-0">
                {title && <h3 className="text-sm font-black uppercase tracking-widest text-[#0d121b] dark:text-white mb-1">{title}</h3>}
                {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
            </div>
        )}
        <div className="p-6 flex-1">
            {children}
        </div>
    </div>
);

const KPICard: React.FC<{ label: string, value: string, trend: string, isPositive?: boolean, icon: string, color: string }> = ({ label, value, trend, isPositive = true, icon, color }) => (
    <Card className="hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <span className={`material-symbols-outlined p-3 rounded-2xl bg-${color}/10 text-${color} text-2xl`}>{icon}</span>
            <div className={`flex items-center gap-1 text-xs font-black ${isPositive ? 'text-green-600' : 'text-orange-500'}`}>
                <span className="material-symbols-outlined text-sm font-fill-1">{isPositive ? 'trending_up' : 'trending_down'}</span>
                {trend}
            </div>
        </div>
        <div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-[#0d121b] dark:text-white">{value}</p>
        </div>
    </Card>
);


const AdminReportsPage: React.FC = () => {
    const navigate = useNavigate();
    const [growthData, setGrowthData] = useState<any[]>([]);
    const [unitEngagement, setUnitEngagement] = useState<any[]>([]);
    const [topPosts, setTopPosts] = useState<any[]>([]);
    const [topTags, setTopTags] = useState<any[]>([]);
    const [stats, setStats] = useState({
        users: { total: '0', trend: '0%' },
        posts: { total: '0', trend: '0%' },
        interactions: { total: '0', trend: '0%' },
        moderation: { pending: '0', trend: '0' }
    });
    
    const [timeframe, setTimeframe] = useState('180');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [schoolsList, setSchoolsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Initial load: Schools and Stats
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [schoolRes, dashboardStats] = await Promise.all([
                    adminAPI.getSchools('limit=100'),
                    adminAPI.getStats()
                ]);
                setSchoolsList(schoolRes.schools || []);
                if (dashboardStats) {
                    setStats({
                        users: { total: dashboardStats.users?.total?.toLocaleString() || '0', trend: dashboardStats.users?.trend || '0%' },
                        posts: { total: dashboardStats.posts?.total?.toLocaleString() || '0', trend: dashboardStats.posts?.trend || '0%' },
                        interactions: { total: dashboardStats.interactions?.total?.toLocaleString() || '0', trend: dashboardStats.interactions?.trend || '0%' },
                        moderation: { pending: dashboardStats.moderation?.pending?.toString() || '0', trend: dashboardStats.moderation?.trend || '0' }
                    });
                }
            } catch (err) {
                console.error("Error fetching initial data", err);
            }
        };
        fetchInitial();
    }, []);

    // Fetch reports when filters change
    useEffect(() => {
        const fetchReports = async () => {
            setRefreshing(true);
            try {
                const query = `days=${timeframe}${selectedSchool ? `&schoolId=${selectedSchool}` : ''}`;
                const reports = await adminAPI.getReports(query);
                
                setGrowthData(reports.growth || []);
                setUnitEngagement(reports.unitEngagement || []);
                setTopPosts(reports.topPosts || []);
                
                const mappedTags = (reports.topTags || []).map((tag: any, idx: number) => {
                    const sizes = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm'];
                    const weights = ['font-black', 'font-bold', 'font-medium'];
                    const colors = ['text-primary', 'text-blue-500', 'text-sky-400', 'text-emerald-500', 'text-orange-500'];
                    return {
                        text: tag.text,
                        size: sizes[idx % sizes.length],
                        weight: weights[idx % weights.length],
                        color: colors[idx % colors.length]
                    };
                });
                setTopTags(mappedTags);
            } catch (error) {
                console.error('Failed to load reports:', error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        };
        fetchReports();
    }, [timeframe, selectedSchool]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-gray-500 font-bold animate-pulse">Sincronizando com a rede municipal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`animate-fade-in space-y-10 ${refreshing ? 'opacity-70 pointer-events-none' : ''} transition-opacity duration-300`}>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[#0d121b] dark:text-white mb-2 underline decoration-primary/20 underline-offset-8">Analytics & Insight</h1>
                    <p className="text-gray-500 font-medium">Métricas de performance e engajamento da rede municipal.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {/* Unit Filter */}
                    <div className="relative group w-full md:w-64">
                         <select 
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-gray-800 border-2 border-gray-100 hover:border-primary/20 rounded-2xl text-xs font-black appearance-none focus:outline-none focus:ring-4 ring-primary/5 transition-all outline-none text-gray-700"
                        >
                            <option value="">Todas as Unidades</option>
                            {schoolsList.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">school</span>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-primary transition-colors">unfold_more</span>
                    </div>

                    {/* Timeframe Buttons */}
                    <div className="flex bg-white dark:bg-gray-800 border p-1 rounded-2xl shadow-sm gap-1 w-full md:w-auto">
                        <button 
                            onClick={() => {
                                const q = `days=${timeframe}${selectedSchool ? `&schoolId=${selectedSchool}` : ''}`;
                                adminAPI.exportReports(q);
                            }}
                            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all flex items-center gap-2 border-r pr-3"
                            title="Exportar dados filtrados"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                        </button>
                        {[
                            { label: '30 Dias', value: '30' },
                            { label: '90 Dias', value: '90' },
                            { label: '180 Dias', value: '180' }
                        ].map(t => (
                            <button 
                                key={t.value}
                                onClick={() => setTimeframe(t.value)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${timeframe === t.value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* KPI Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard label="Usuários (Período)" value={stats.users.total} trend={stats.users.trend} icon="groups" color="primary" />
                <KPICard label="Interações (Período)" value={stats.interactions.total} trend={stats.interactions.trend} icon="forum" color="blue-500" />
                <KPICard label="Novas Postagens" value={stats.posts.total} trend={stats.posts.trend} icon="post_add" color="rose-500" />
                <KPICard label="Itens em Moderação" value={stats.moderation.pending} trend={stats.moderation.trend} isPositive={parseInt(stats.moderation.pending) === 0} icon="pending_actions" color="orange-500" />
            </section>

            {/* Main Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <Card className="lg:col-span-2" title="Trajetória de Crescimento" subtitle="Evolução de novos usuários vs postagens">
                    <div className="h-[350px] w-full mt-6">
                        {growthData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthData}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9CA3AF'}} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }} 
                                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" name="Novos Usuários" />
                                    <Area type="monotone" dataKey="posts" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPosts)" name="Postagens" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">Nenhum dado histórico no intervalo selecionado</div>
                        )}
                    </div>
                </Card>

                {/* Tag cloud */}
                <Card title="Nuvem de Tópicos" subtitle="Hashtags e termos extraídos de posts" className="flex flex-col">
                    <div className="flex-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 p-4 mt-4">
                        {topTags.length > 0 ? topTags.map((tag, idx) => (
                            <span 
                                key={idx} 
                                className={`${tag.size} ${tag.weight} ${tag.color} hover:scale-110 transition-transform cursor-default select-none opacity-80 hover:opacity-100`}
                            >
                                {tag.text}
                            </span>
                        )) : (
                            <div className="text-gray-400 text-sm italic">Aguardando mais postagens...</div>
                        )}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-8">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-gray-400">Analítico</p>
                            <p className="text-sm font-bold text-primary">Tag Cloud</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-gray-400">Processamento</p>
                            <p className="text-sm font-bold text-blue-500">Live NLP</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Units & Detailed Content */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ranking by Unit */}
                {!selectedSchool && (
                <Card title="Ranking de Unidades" subtitle="Engajamento agregado por instituição">
                    <div className="h-[280px] w-full mt-6">
                        {unitEngagement.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={unitEngagement} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#0d121b'}} width={120} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(0,0,0,0.03)'}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="engagement" radius={[0, 8, 8, 0]} barSize={24} name="Interações">
                                        {unitEngagement.map((entry, index) => {
                                            const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899'];
                                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">Dados de unidades ainda não computados</div>
                        )}
                    </div>
                </Card>
                )}

                {/* Top Posts Table/List */}
                <Card 
                  className={selectedSchool ? "lg:col-span-2" : ""}
                  title="Posts com Mais Engajamento" 
                  subtitle="Conteúdos em destaque no banco de dados"
                >
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {topPosts.length > 0 ? topPosts.map((post, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-white border border-transparent hover:border-primary/10 hover:shadow-sm rounded-2xl transition-all group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="size-9 rounded-xl bg-white flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-gray-100">
                                        <span className="material-symbols-outlined text-base">analytics</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black truncate text-gray-800">{post.label}</p>
                                        <p className="text-[10px] text-gray-500 font-medium truncate">{post.author}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-black text-primary">{post.val.toLocaleString()}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Interações</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400 text-sm italic col-span-2">Nenhum post engajado encontrado no período</div>
                        )}
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default AdminReportsPage;
