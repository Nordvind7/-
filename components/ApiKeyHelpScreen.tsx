/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ApiKeyHelpScreenProps {
    onAcknowledge: () => void;
}

const ApiKeyHelpScreen: React.FC<ApiKeyHelpScreenProps> = ({ onAcknowledge }) => (
  <div className="text-center animate-fade-in bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20 p-6 md:p-8 rounded-lg max-w-3xl mx-auto flex flex-col items-center gap-6">
    <h2 className="text-2xl md:text-3xl font-bold text-yellow-800 dark:text-yellow-200">Настройка API-ключа</h2>
    <p className="text-base md:text-lg text-yellow-700 dark:text-yellow-300">
      Похоже, вашему сайту не удаётся получить доступ к API-ключу. Это обычная проблема при настройке. Пожалуйста, проверьте следующие шаги в настройках вашего сайта на Netlify.
    </p>
    
    <ol className="text-left text-sm md:text-base text-gray-800 dark:text-gray-300 space-y-4 list-decimal list-inside bg-white dark:bg-gray-800/50 p-6 rounded-md w-full shadow-sm">
      <li>
        Перейдите в настройки вашего сайта на Netlify и откройте раздел: <br/>
        <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm mt-1 inline-block">Site configuration → Environment variables</code>
      </li>
      <li>
        Убедитесь, что у вас есть переменная с <strong>точным именем</strong> (регистр важен): <br/>
        <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm mt-1 inline-block">API_KEY</code>
      </li>
      <li>
        Вставьте ваш API-ключ от Google AI в поле 'Value' для этой переменной.
      </li>
      <li className="font-semibold text-blue-600 dark:text-blue-400">
        <strong>Важно:</strong> После сохранения переменной необходимо заново развернуть (re-deploy) сайт. Перейдите в раздел <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm">Deploys</code> и нажмите <code className="bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 font-mono text-sm">Trigger deploy → Deploy site</code>.
      </li>
    </ol>
    
    <button
      onClick={onAcknowledge}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors mt-4"
    >
      Я всё проверил
    </button>
  </div>
);

export default ApiKeyHelpScreen;