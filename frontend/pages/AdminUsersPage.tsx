
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, getMediaUrl } from '../api';
import { User, UserRole } from '../types';
import { useModal } from '../contexts/ModalContext';
import { IMAGES } from '../constants';

interface AdminUser extends User {
    school?: string;
    createdAt?: string;
}

const AdminUsersPage: React.FC = () => {
    const navigate = useNavigate();
    const { showModal } = useModal();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editPassword, setEditPassword] = useState('');
    const [showEditPassword, setShowEditPassword] = useState(false);

    // New User Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'ALUNO' as UserRole,
        school: '',
        schoolId: ''
    });

    const [schoolsList, setSchoolsList] = useState<{ id: string, name: string }[]>([]);

    const fetchSchoolsList = async () => {
        try {
            const data = await adminAPI.getSchools('page=1&limit=100');
            if (data.schools) {
                setSchoolsList(data.schools.map((s: any) => ({ id: s.id, name: s.name })));
            }
        } catch (error) {
            console.error('Failed to fetch schools list', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = `page=${page}&limit=10${search ? `&search=${search}` : ''}`;
            const data = await adminAPI.getUsers(query);
            setUsers(data.users || []); // Ensure array
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            // Mock data for fallback if API fails
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchSchoolsList();
    }, [page, search]);

    const handleDelete = async (id: string) => {
        showModal({
            title: 'Confirmar Exclusão',
            message: 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.',
            type: 'warning',
            confirmLabel: 'Excluir',
            onConfirm: async () => {
                try {
                    await adminAPI.deleteUser(id);
                    fetchUsers();
                    showModal({ title: 'Sucesso', message: 'Usuário excluído com sucesso!', type: 'success' });
                } catch (error) {
                    console.error(error);
                    showModal({ title: 'Erro', message: 'Erro ao excluir usuário', type: 'error' });
                }
            }
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminAPI.createUser(newUser);
            setIsCreating(false);
            setNewUser({ name: '', email: '', password: '', role: 'ALUNO', school: '', schoolId: '' });
            fetchUsers();
            showModal({ title: 'Sucesso', message: 'Usuário criado com sucesso!', type: 'success' });
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro', message: 'Erro ao criar usuário', type: 'error' });
        }
    };


    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await adminAPI.updateUser(editingUser.id, {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                school: editingUser.school,
                schoolId: (editingUser as any).schoolId,
                password: editPassword // Add password if set
            });
            setEditingUser(null);
            setEditPassword(''); // Reset
            fetchUsers();
            showModal({ title: 'Sucesso', message: 'Usuário atualizado com sucesso!', type: 'success' });
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro', message: 'Erro ao atualizar usuário', type: 'error' });
        }
    };


    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await adminAPI.importUsers(file);
            showModal({ title: 'Sucesso', message: 'Importação enviada para processamento!', type: 'success' });
            fetchUsers();
        } catch (error) {
            console.error(error);
            showModal({ title: 'Erro', message: 'Erro na importação: Verifique o formato do arquivo.', type: 'error' });
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Gestão de Usuários</h1>
                    <p className="text-gray-500">Gerencie alunos, professores e administradores.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 transition-all font-bold"
                    >
                        <span className="material-symbols-outlined">add</span> Novo Usuário
                    </button>
                    <button onClick={adminAPI.exportUsers} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
                        <span className="material-symbols-outlined">download</span> Exportar
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer font-medium transition-colors">
                        <span className="material-symbols-outlined">upload</span> Importar
                        <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm mb-8 border border-gray-100 dark:border-gray-800">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou escola..."
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none p-4 pl-12 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b dark:border-gray-800">
                        <tr>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Usuário</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Função</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500">Escola</th>
                            <th className="p-5 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {users.length > 0 ? users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={getMediaUrl(user.avatar) || IMAGES.DEFAULT_AVATAR}
                                            className="size-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                            alt=""
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100">{user.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                        user.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                                        user.role === 'PROFESSOR' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30' :
                                        'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-5 text-sm text-gray-600 dark:text-gray-300 font-medium">{user.school || '—'}</td>
                                <td className="p-5">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Editar"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title="Excluir"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700">search_off</span>
                                        <p>Nenhum usuário encontrado.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="p-4 border-t dark:border-gray-800 flex justify-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-50">Anterior</button>
                        <span className="px-3 py-1 dark:text-gray-400">Página {page} de {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-50">Próxima</button>
                    </div>
                )}
            </div>

                 {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold dark:text-white">Novo Usuário</h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Nome Completo</label>
                                <input
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Senha Provisória</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
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
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Função</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none dark:text-white"
                                >
                                    <option value="ALUNO">Aluno</option>
                                    <option value="PROFESSOR">Professor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            {newUser.role !== 'ADMIN' && (
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Escola / Unidade</label>
                                    {newUser.role === 'PROFESSOR' ? (
                                        <select
                                            value={newUser.schoolId}
                                            onChange={e => {
                                                const selectedSchool = schoolsList.find(s => s.id === e.target.value);
                                                setNewUser({
                                                    ...newUser,
                                                    schoolId: e.target.value,
                                                    school: selectedSchool ? selectedSchool.name : ''
                                                });
                                            }}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none dark:text-white"
                                        >
                                            <option value="">Selecione a Unidade de Lotação</option>
                                            {schoolsList.map(school => (
                                                <option key={school.id} value={school.id}>{school.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            value={newUser.school}
                                            onChange={e => setNewUser({ ...newUser, school: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                            placeholder="Nome da escola (Alunos)"
                                        />
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                                >
                                    Criar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold dark:text-white">Editar Usuário</h2>
                            <button onClick={() => { setEditingUser(null); setEditPassword(''); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Nome</label>
                                <input
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    value={editingUser.email}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Nova Senha (Opcional)</label>
                                <div className="relative">
                                    <input
                                        type={showEditPassword ? 'text' : 'password'}
                                        value={editPassword}
                                        onChange={e => setEditPassword(e.target.value)}
                                        placeholder="Deixe em branco para manter a atual"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none pr-10 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword(!showEditPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="material-symbols-outlined text-xl">{showEditPassword ? 'visibility' : 'visibility_off'}</span>
                                    </button>
                                </div>
                            </div>
                            {editingUser.role === 'PROFESSOR' ? (
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Escola / Unidade (Busca)</label>
                                    <div className="relative group">
                                        <input
                                            list="edit-schools-list"
                                            value={editingUser.school || ''}
                                            onChange={e => {
                                                const name = e.target.value;
                                                const selected = schoolsList.find(s => s.name === name);
                                                setEditingUser({
                                                    ...editingUser,
                                                    school: name,
                                                    schoolId: selected ? selected.id : (editingUser as any).schoolId
                                                } as any);
                                            }}
                                            placeholder="Digite para pesquisar a unidade..."
                                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none font-medium pr-10 dark:text-white"
                                        />
                                        <datalist id="edit-schools-list">
                                            {schoolsList.map(school => (
                                                <option key={school.id} value={school.name} />
                                            ))}
                                        </datalist>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-xl">search</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5 ml-1 uppercase font-bold tracking-wider italic">Dica: Digite o nome ou o INEP para filtrar</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Escola</label>
                                    <input
                                        value={editingUser.school || ''}
                                        onChange={e => setEditingUser({ ...editingUser, school: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none dark:text-white"
                                        placeholder="Nome da escola (Alunos)"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Função</label>
                                <select
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none appearance-none cursor-pointer font-medium dark:text-white"
                                >
                                    <option value="ALUNO">Aluno</option>
                                    <option value="PROFESSOR">Professor</option>
                                    <option value="ADMIN">Administrador</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => { setEditingUser(null); setEditPassword(''); }}
                                    className="px-5 py-2.5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
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

export default AdminUsersPage;
