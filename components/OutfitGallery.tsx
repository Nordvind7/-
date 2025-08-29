/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface Outfit {
    url: string;
    name: string;
}

interface OutfitGalleryProps {
    outfits: Outfit[];
    onSelect: (url: string) => void;
    selectedUrl: string | null;
    disabled?: boolean;
}

const OutfitGallery: React.FC<OutfitGalleryProps> = ({ outfits, onSelect, selectedUrl, disabled }) => {
    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700/50">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Или примерьте готовые образы
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                {outfits.map((outfit) => (
                    <button
                        key={outfit.url}
                        onClick={() => !disabled && onSelect(outfit.url)}
                        disabled={disabled}
                        className={`relative aspect-square w-full rounded-lg overflow-hidden border-4 transition-all duration-200 ${
                            selectedUrl === outfit.url
                                ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        aria-label={`Выбрать ${outfit.name}`}
                    >
                        <img
                            src={outfit.url}
                            alt={outfit.name}
                            className="w-full h-full object-contain bg-white dark:bg-gray-700"
                        />
                         {selectedUrl === outfit.url && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-1/3 w-1/3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center">
                            <p className="text-white text-xs font-semibold truncate">{outfit.name}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OutfitGallery;
