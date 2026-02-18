
import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { SingleImageUpload } from '../components/SingleImageUpload';

const AdminSettingsPage: React.FC = () => {
    const { settings, updateSettings, loading } = useSettings();
    const [formData, setFormData] = useState({
        APP_NAME: '',
        PRIMARY_COLOR: '#000000',
        LOGO_URL: '',
        FAVICON_URL: ''
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                APP_NAME: settings.APP_NAME || 'EduConnect',
                PRIMARY_COLOR: settings.PRIMARY_COLOR || '#2563eb',
                LOGO_URL: settings.LOGO_URL || '',
                FAVICON_URL: settings.FAVICON_URL || ''
            });
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (key: string, url: string) => {
        setFormData(prev => ({ ...prev, [key]: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettings(formData);
            alert('Configurações salvas e aplicadas!');
        } catch (error) {
            alert('Erro ao salvar configurações.');
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-8">Configurações do Sistema</h1>

            <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-8 rounded-2xl shadow-sm max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <label className="block text-sm font-bold mb-2 dark:text-gray-300">Nome da Aplicação</label>
                        <input
                            name="APP_NAME"
                            value={formData.APP_NAME}
                            onChange={handleChange}
                            className="w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 p-3 rounded-xl dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 dark:text-gray-300">Cor Primária</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="color"
                                name="PRIMARY_COLOR"
                                value={formData.PRIMARY_COLOR}
                                onChange={handleChange}
                                className="h-12 w-24 cursor-pointer rounded-lg border-0 p-0"
                            />
                            <span className="text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">{formData.PRIMARY_COLOR}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Essa cor será aplicada em botões e destaques.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <SingleImageUpload
                                label="Logotipo da Plataforma"
                                imageUrl={formData.LOGO_URL}
                                onImageChange={(url) => handleImageChange('LOGO_URL', url)}
                                description="Formato PNG ou SVG. Será exibido no cabeçalho e login."
                            />
                        </div>

                        <div>
                            <SingleImageUpload
                                label="Favicon (Ícone da Aba)"
                                imageUrl={formData.FAVICON_URL}
                                onImageChange={(url) => handleImageChange('FAVICON_URL', url)}
                                description="Ícone pequeno (32x32 ou 64x64). Formato PNG ou ICO."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t dark:border-gray-800">
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
