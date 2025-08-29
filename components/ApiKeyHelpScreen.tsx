/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ApiKeyHelpScreenProps {
    onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyHelpScreen: React.FC<ApiKeyHelpScreenProps> = ({ onApiKeySubmit }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onApiKeySubmit(apiKey.trim());
        }
    };

    return (
        <div className="text-center animate-fade-in bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20 p-6 md:p-8 rounded-lg max-w-3xl mx-auto flex flex-col items-center gap-6">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-800 dark:text-yellow-200">Требуется API-ключ</h2>
            <p className="text-base md:text-lg text-yellow-700 dark:text-yellow-300">
                Чтобы протестировать это приложение, введите свой API-ключ Google AI. Ваш ключ будет сохранён только в сессии вашего браузера.
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4 items-center">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Введите ваш API-ключ"
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    aria-label="API Key Input"
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors w-full disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={!apiKey.trim()}
                >
                    Сохранить и попробовать снова
                </button>
            </form>

            <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50 my-2"></div>

            <details className="w-full text-left">
                <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-300 hover:underline">
                    Как настроить ключ для развёрнутого сайта (Netlify)
                </summary>
                <ol className="mt-4 text-sm md:text-base text-gray-800 dark:text-gray-300 space-y-4 list-decimal list-inside bg-white dark:bg-gray-800/50 p-6 rounded-md w-full shadow-sm">
                    <li>
                        Перейдите в настройки вашего сайта на Netlify и откройте раздел: <br />
                        <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm mt-1 inline-block">Site configuration → Environment variables</code>
                    </li>
                    <li>
                        Убедитесь, что у вас есть переменная с <strong>точным именем</strong> (регистр важен): <br />
                        <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm mt-1 inline-block">API_KEY</code>
                    </li>
                    <li>
                        Вставьте ваш API-ключ от Google AI в поле 'Value' для этой переменной.
                    </li>
                    <li className="font-semibold text-blue-600 dark:text-blue-400">
                        <strong>Важно:</strong> После сохранения переменной необходимо заново развернуть (re-deploy) сайт. Перейдите в раздел <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm">Deploys</code> и нажмите <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm">Trigger deploy → Deploy site</code>.
                    </li>
                </ol>
            </details>
        </div>
    );
};

export default ApiKeyHelpScreen;