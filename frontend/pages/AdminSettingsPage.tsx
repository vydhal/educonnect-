
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const AdminSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const { settings, updateSetting, loading } = useSettings();
    const [formData, setFormData] = useState({
        APP_NAME: '',
        PRIMARY_COLOR: '#000000',
        LOGO_URL: ''
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                APP_NAME: settings.APP_NAME || 'EduConnect',
                PRIMARY_COLOR: settings.PRIMARY_COLOR || '#2563eb',
                LOGO_URL: settings.LOGO_URL || ''
            });
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Update one by one or create a bulk update method in context
            await updateSetting('APP_NAME', formData.APP_NAME);
            await updateSetting('PRIMARY_COLOR', formData.PRIMARY_COLOR);
            if (formData.LOGO_URL) await updateSetting('LOGO_URL', formData.LOGO_URL);

            alert('Configurações salvas!');
        } catch (error) {
            alert('Erro ao salvar configurações.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-8">Configurações do Sistema</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2">Nome da Aplicação</label>
                        <input
                            name="APP_NAME"
                            value={formData.APP_NAME}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border p-3 rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">Cor Primária</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                name="PRIMARY_COLOR"
                                value={formData.PRIMARY_COLOR}
                                onChange={handleChange}
                                className="h-12 w-24 cursor-pointer"
                            />
                            <span className="text-gray-500">{formData.PRIMARY_COLOR}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">URL do Logotipo</label>
                        <input
                            name="LOGO_URL"
                            value={formData.LOGO_URL}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border p-3 rounded-xl"
                            placeholder="https://..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-all"
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
