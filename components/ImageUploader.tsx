/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  title: string;
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  disabled?: boolean;
  helpText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onFileSelect, imageUrl, disabled, helpText }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect, disabled]);
    
    const inputId = `image-upload-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
            <div className="w-full h-96 bg-gray-100 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
                        {!disabled && (
                             <label htmlFor={inputId} className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-900/80 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-900 transition-colors backdrop-blur-sm">
                                Изменить
                            </label>
                        )}
                    </>
                ) : (
                    <div 
                        className={`w-full h-full flex flex-col items-center justify-center p-4 text-center transition-colors duration-200 ${isDraggingOver ? 'bg-blue-500/10' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDraggingOver(true); }}
                        onDragLeave={() => setIsDraggingOver(false)}
                        onDrop={handleDrop}
                    >
                        <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <label htmlFor={inputId} className={`font-semibold text-blue-500 dark:text-blue-400 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:underline'}`}>
                            Выберите файл
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">или перетащите</p>
                    </div>
                )}
                 {!disabled && <input id={inputId} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />}
            </div>
            {helpText && <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2 max-w-sm">{helpText}</p>}
        </div>
    );
};

export default ImageUploader;
