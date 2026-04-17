
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import { useModal } from '../contexts/ModalContext';

interface SchoolUser {
    id: string;
    name: string;
    email: string;
    role: string;
    inep?: string;
    zone?: 'URBANA' | 'RURAL';
    address?: string;
    phone?: string;
    avatar?: string;
    schoolType?: 'ESCOLA' | 'CRECHE' | 'CMEI';
}

const AdminSchoolsPage: React.FC = () => {
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [schools, setSchools] = useState<SchoolUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [zoneFilter, setZoneFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingSchool, setEditingSchool] = useState<SchoolUser | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSchool, setNewSchool] = useState({
        name: '',
        email: '',
        password: '',
        inep: '',
        zone: 'URBANA',
        address: '',
        phone: '',
        schoolType: 'ESCOLA'
    });
    const [showPassword, setShowPassword] = useState(false);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const query = `page=${page}&limit=10${search ? `&search=${search}` : ''}${zoneFilter ? `&zone=${zoneFilter}` : ''}`;
            const data = await adminAPI.getSchools(query);
            setSchools(data.schools || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch schools:', error);
            setSchools([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchools();
    }, [page, search, zoneFilter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminAPI.createSchool(newSchool);
            setIsCreating(false);
            setNewSchool({ name: '', email: '', password: '', inep: '', zone: 'URBANA', address: '', phone: '', schoolType: 'ESCOLA' });
            fetchSchools();
            showModal({ title: 'Escola Cadastrada', message: 'A unidade educacional foi registrada com sucesso no sistema.', type: 'success' });
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro no Cadastro', message: 'Não foi possível cadastrar a unidade. Verifique o email e o INEP.', type: 'error' });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchool) return;
        try {
            await adminAPI.updateUser(editingSchool.id, editingSchool);
            setEditingSchool(null);
            fetchSchools();
            showModal({ title: 'Atualização Concluída', message: 'Os dados da unidade foram atualizados com sucesso.', type: 'success' });
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro na Atualização', message: 'Não foi possível salvar as alterações da escola.', type: 'error' });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        showModal({
            title: 'Excluir Unidade?',
            message: `Tem certeza que deseja remover "${name}"? Esta ação removerá o acesso da escola ao sistema e não pode ser desfeita.`,
            type: 'warning',
            confirmLabel: 'Sim, Excluir',
            cancelLabel: 'Manter Escola',
            onConfirm: async () => {
                try {
                    await adminAPI.deleteUser(id);
                    fetchSchools();
                    showModal({ title: 'Escola Removida', message: 'A unidade foi excluída permanentemente.', type: 'success' });
                } catch (error) {
                    console.error(error);
                    showModal({ title: 'Erro ao Excluir', message: 'Não foi possível remover esta unidade no momento.', type: 'error' });
                }
            }
        });
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // (existing code...)
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const schools = lines.slice(1).filter(line => line.trim() !== '').map(line => {
                const values = line.split(',').map(v => v.trim());
                const school: any = {};
                headers.forEach((header, index) => {
                    let val = values[index] || '';
                    if (val.startsWith('"') && val.endsWith('"')) {
                        val = val.substring(1, val.length - 1);
                    }
                    school[header.toLowerCase()] = val;
                });
                return school;
            });

            if (schools.length === 0) {
                showModal({ title: 'Arquivo Inválido', message: 'O arquivo parece estar vazio ou não contém escolas válidas.', type: 'warning' });
                return;
            }

            try {
                setLoading(true);
                const result = await adminAPI.importSchools(schools);
                showModal({ 
                    title: 'Importação Concluída', 
                    message: `O processamento do arquivo foi finalizado. Sucesso: ${result.imported}${result.errors?.length > 0 ? `, Erros: ${result.errors.length}` : ''}`, 
                    type: result.errors?.length > 0 ? 'warning' : 'success' 
                });
                fetchSchools();
            } catch (error: any) {
                console.error(error);
                showModal({ title: 'Falha na Importação', message: 'Houve um erro técnico ao processar as escolas do CSV.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-display dark:text-white">Gestão de Escolas</h1>
                    <p className="text-gray-500">Gerencie as unidades educacionais da rede.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => adminAPI.downloadSchoolTemplate()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-medium border border-gray-200 dark:border-gray-700"
                    >
                        <span className="material-symbols-outlined">download</span> Baixar Modelo
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all font-bold"
                    >
                        <span className="material-symbols-outlined">add_business</span> Nova Escola
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer font-medium">
                        <span className="material-symbols-outlined">upload</span> Importar CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm mb-8 border border-gray-100 dark:border-gray-800 flex gap-4">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou INEP..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none p-4 pl-12 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-800 border-none p-4 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all min-w-[200px] dark:text-white"
                >
                    <option value="">Todas as Zonas</option>
                    <option value="URBANA">Urbana</option>
                    <option value="RURAL">Rural</option>
                </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                        <tr>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Escola</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">INEP</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Zona</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Contato</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {schools.length > 0 ? schools.map(school => (
                            <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800">
                                            {school.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{school.name}</p>
                                            <p className="text-xs text-gray-500">{school.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 text-sm font-medium text-gray-700">{school.inep || '—'}</td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${school.zone === 'RURAL'
                                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                        : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                                        }`}>
                                        {school.zone || 'N/A'}
                                    </span>
                                    {school.schoolType && (
                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${school.schoolType === 'CRECHE' 
                                            ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' 
                                            : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
                                            }`}>
                                            {school.schoolType}
                                        </span>
                                    )}
                                </td>
                                <td className="p-5 text-sm text-gray-600 font-medium">
                                    <div className="flex flex-col">
                                        <span>{school.phone || '—'}</span>
                                        <span className="text-xs text-gray-400 truncate max-w-[200px]">{school.address}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => setEditingSchool(school)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors" 
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(school.id, school.name)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors" 
                                            title="Excluir"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-4xl text-gray-300">school</span>
                                        <p>Nenhuma escola encontrada.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="p-4 border-t flex justify-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                        <span className="px-3 py-1">Página {page} de {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Próxima</button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-display dark:text-white">Nova Escola</h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Nome da Escola</label>
                                <input
                                    required
                                    value={newSchool.name}
                                    onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Email Administrativo</label>
                                <input
                                    required
                                    type="email"
                                    value={newSchool.email}
                                    onChange={e => setNewSchool({ ...newSchool, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Senha de Acesso</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={newSchool.password}
                                        onChange={e => setNewSchool({ ...newSchool, password: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none pr-10 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Código INEP</label>
                                <input
                                    value={newSchool.inep}
                                    onChange={e => setNewSchool({ ...newSchool, inep: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Zona</label>
                                <select
                                    value={newSchool.zone}
                                    onChange={e => setNewSchool({ ...newSchool, zone: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none dark:text-white"
                                >
                                    <option value="URBANA">Urbana</option>
                                    <option value="RURAL">Rural</option>
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Tipo de Unidade</label>
                                <select
                                    value={newSchool.schoolType}
                                    onChange={e => setNewSchool({ ...newSchool, schoolType: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none dark:text-white"
                                >
                                    <option value="ESCOLA">Escola (EMEF)</option>
                                    <option value="CRECHE">Creche</option>
                                    <option value="CMEI">CMEI</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Endereço Completo</label>
                                <input
                                    value={newSchool.address}
                                    onChange={e => setNewSchool({ ...newSchool, address: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                    placeholder="Rua, Número, Bairro, CEP"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Telefone/Contato</label>
                                <input
                                    value={newSchool.phone}
                                    onChange={e => setNewSchool({ ...newSchool, phone: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-4 border-t dark:border-gray-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                >
                                    Cadastrar Escola
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingSchool && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-2xl">edit_square</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold font-display dark:text-white">Editar Escola</h2>
                                    <p className="text-gray-500 text-sm">Atualize as informações da unidade educacional.</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingSchool(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Nome da Escola</label>
                                <input
                                    required
                                    value={editingSchool.name}
                                    onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Email Administrativo</label>
                                <input
                                    required
                                    type="email"
                                    value={editingSchool.email}
                                    onChange={e => setEditingSchool({ ...editingSchool, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Código INEP</label>
                                <input
                                    value={editingSchool.inep}
                                    onChange={e => setEditingSchool({ ...editingSchool, inep: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Zona</label>
                                <select
                                    value={editingSchool.zone}
                                    onChange={e => setEditingSchool({ ...editingSchool, zone: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none dark:text-white"
                                >
                                    <option value="URBANA">Urbana</option>
                                    <option value="RURAL">Rural</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Tipo de Unidade</label>
                                <select
                                    value={editingSchool.schoolType}
                                    onChange={e => setEditingSchool({ ...editingSchool, schoolType: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none dark:text-white"
                                >
                                    <option value="ESCOLA">Escola (EMEF)</option>
                                    <option value="CRECHE">Creche</option>
                                    <option value="CMEI">CMEI</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Endereço Completo</label>
                                <input
                                    value={editingSchool.address}
                                    onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Telefone/Contato</label>
                                <input
                                    value={editingSchool.phone}
                                    onChange={e => setEditingSchool({ ...editingSchool, phone: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 mt-6 border-t dark:border-gray-800 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingSchool(null)}
                                    className="px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:opacity-90 transition-all shadow-xl shadow-primary/25 active:scale-95"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSchoolsPage;
