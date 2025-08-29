/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface GenderSelectorProps {
    onSelect: (gender: 'male' | 'female') => void;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ onSelect }) => {
    return (
        <div className="w-full max-w-2xl mx-auto text-center p-8 animate-fade-in flex flex-col items-center gap-8 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Для кого подбираем образ?
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 w-full">
                <button
                    onClick={() => onSelect('male')}
                    className="flex-1 text-center bg-sky-100 hover:bg-sky-200 border-2 border-sky-300 text-sky-800 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 dark:border-sky-500/50 dark:text-sky-200 font-bold py-10 px-6 rounded-xl transition-all duration-200 ease-in-out active:scale-95 text-2xl"
                >
                    Мужчина
                </button>
                <button
                    onClick={() => onSelect('female')}
                    className="flex-1 text-center bg-pink-100 hover:bg-pink-200 border-2 border-pink-300 text-pink-800 dark:bg-pink-500/20 dark:hover:bg-pink-500/30 dark:border-pink-500/50 dark:text-pink-200 font-bold py-10 px-6 rounded-xl transition-all duration-200 ease-in-out active:scale-95 text-2xl"
                >
                    Женщина
                </button>
            </div>
        </div>
    );
};

export default GenderSelector;
