/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useEffect } from 'react';
import { generateVirtualTryOn } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import ImageUploader from './components/ImageUploader';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [personImageUrl, setPersonImageUrl] = useState<string | null>(null);
  const [clothingImageUrl, setClothingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (personImage) {
      const url = URL.createObjectURL(personImage);
      setPersonImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPersonImageUrl(null);
  }, [personImage]);

  useEffect(() => {
    if (clothingImage) {
      const url = URL.createObjectURL(clothingImage);
      setClothingImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setClothingImageUrl(null);
  }, [clothingImage]);

  const handlePersonImageSelect = useCallback((file: File) => {
    setPersonImage(file);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
  }, []);

  const handleClothingImageSelect = useCallback((file: File) => {
    setClothingImage(file);
    setResultImage(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!personImage || !clothingImage) {
      setError("Пожалуйста, загрузите ваше фото и фото одежды.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultImage(null);
    try {
      const result = await generateVirtualTryOn(personImage, clothingImage);
      setResultImage(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
      setError(`Не удалось сгенерировать изображение. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [personImage, clothingImage]);
  
  const handleStartOver = useCallback(() => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
  }, []);
  
  const handleDownload = useCallback(() => {
    if (resultImage) {
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `virtual-try-on-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }, [resultImage]);

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-red-300">Произошла ошибка</h2>
          <p className="text-md text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    if (!personImage) {
      return <StartScreen onFileSelect={(files) => files && handlePersonImageSelect(files[0])} />;
    }

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 animate-fade-in">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageUploader
            title="Ваше фото"
            onFileSelect={handlePersonImageSelect}
            imageUrl={personImageUrl}
            disabled={isLoading}
          />
          <ImageUploader
            title="Фото одежды"
            onFileSelect={handleClothingImageSelect}
            imageUrl={clothingImageUrl}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !personImage || !clothingImage}
          className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-5 px-12 text-xl rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Генерация...' : 'Примерить'}
        </button>
        
        <div className="w-full h-px bg-gray-700/50 my-4"></div>

        {(isLoading || resultImage) && (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-100">Ваша виртуальная примерка</h2>
                <div className="w-full md:w-1/2 h-[32rem] bg-gray-800/50 border-2 border-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {isLoading && (
                      <div className="flex flex-col items-center gap-4">
                          <Spinner />
                          <p className="text-gray-300">ИИ-стилист работает...</p>
                      </div>
                    )}
                    {resultImage && !isLoading && (
                        <img src={resultImage} alt="Результат виртуальной примерки" className="w-full h-full object-contain" />
                    )}
                </div>
                {resultImage && !isLoading && (
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                        <button 
                            onClick={handleDownload}
                            className="bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                        >
                            Скачать изображение
                        </button>
                         <button 
                            onClick={handleStartOver}
                            className="text-center bg-white/10 border border-white/20 text-gray-200 font-semibold py-3 px-6 rounded-md transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-base"
                        >
                            Начать сначала
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center ${personImage ? 'items-start' : 'items-center'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;