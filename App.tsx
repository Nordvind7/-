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
import GenderSelector from './components/GenderSelector';
import OutfitGallery from './components/OutfitGallery';

type Step = 'start' | 'gender' | 'clothing' | 'generating' | 'result' | 'error';
type Gender = 'male' | 'female';

const OUTFITS: Record<Gender, { url: string; name: string; }[]> = {
    male: [
        { url: 'https://i.postimg.cc/5yxL4b03/1b8c98e0541a0747a5d54b3d22205606.jpg', name: 'Черная футболка' },
        { url: 'https://i.postimg.cc/j5Yy1zYB/425d672e42140df9cd40589f6653b17b.jpg', name: 'Бежевый свитер' },
        { url: 'https://i.postimg.cc/nzKqfCHr/d59e7680fe5354dc21e260a65999407c.jpg', name: 'Коричневая куртка' },
        { url: 'https://i.postimg.cc/gcD3MXSB/image.png', name: 'Синяя рубашка' },
        { url: 'https://i.postimg.cc/8PzfZV3Y/mens-jacket.jpg', name: 'Джинсовая куртка' },
        { url: 'https://i.postimg.cc/mD0FqS9g/mens-hoodie.jpg', name: 'Серое худи' },
        { url: 'https://i.postimg.cc/W1Y4bC6g/mens-polo.jpg', name: 'Белое поло' },
        { url: 'https://i.postimg.cc/k47Z5bC0/mens-coat.jpg', name: 'Черное пальто' },
        { url: 'https://i.postimg.cc/tJg7xQ1b/mens-shirt-checked.jpg', name: 'Клетчатая рубашка' },
    ],
    female: [
        { url: 'https://i.postimg.cc/htRtFM5D/1.png', name: 'Белая блузка' },
        { url: 'https://i.postimg.cc/jSyCCB7n/1eme0kdi9ri9bhsoqddp9pqvzq3n2fl6.png', name: 'Кожаная куртка' },
        { url: 'https://i.postimg.cc/m2vtLTtG/2.png', name: 'Черный топ' },
        { url: 'https://i.postimg.cc/nr6ch1V1/hhtk6fqwrixmh6dffoyadh9vq0j4pm4p.png', name: 'Джинсовая куртка' },
        { url: 'https://i.postimg.cc/5jdbVNp7/mdg7hwpjrpi7w884ucq2h553so7m1zy3.png', name: 'Розовый свитер' },
        { url: 'https://i.postimg.cc/cC80287t/ob9etew2cipogiwucaig0d14ygycnnn6.png', name: 'Бежевый пиджак' },
        { url: 'https://i.postimg.cc/KzWqJdZ6/female-dress-red.png', name: 'Красное платье' },
        { url: 'https://i.postimg.cc/d1mXn4P7/female-cardigan-green.png', name: 'Зеленый кардиган' },
        { url: 'https://i.postimg.cc/pT3r5y8Z/female-turtleneck.png', name: 'Черная водолазка' },
        { url: 'https://i.postimg.cc/y8B4J7Jj/female-blouse-floral.png', name: 'Блузка с принтом' },
        { url: 'https://i.postimg.cc/sXgY0N0T/female-coat-beige.png', name: 'Классический тренч' },
        { url: 'https://i.postimg.cc/26Z8K9jG/female-jumpsuit.png', name: 'Синий комбинезон' },
    ]
};


const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [step, setStep] = useState<Step>('start');
  const [gender, setGender] = useState<Gender | null>(null);
  const [selectedOutfitUrl, setSelectedOutfitUrl] = useState<string | null>(null);

  const [personImageUrl, setPersonImageUrl] = useState<string | null>(null);
  const [clothingImageUrl, setClothingImageUrl] = useState<string | null>(null);

  // Create Object URLs for image previews
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

  // Handlers for user actions
  const handlePersonImageSelect = useCallback((file: File) => {
    setPersonImage(file);
    setStep('gender');
    // Reset subsequent selections
    setGender(null);
    setClothingImage(null);
    setSelectedOutfitUrl(null);
    setResultImage(null);
    setError(null);
  }, []);

  const handleGenderSelect = useCallback((selectedGender: Gender) => {
    setGender(selectedGender);
    setStep('clothing');
  }, []);

  const handleClothingImageSelect = useCallback((file: File) => {
    setClothingImage(file);
    setSelectedOutfitUrl(null); // Deselect gallery outfit if user uploads their own
    setResultImage(null);
    setError(null);
  }, []);
  
  const handleOutfitSelect = useCallback((url: string) => {
      setSelectedOutfitUrl(url);
      setClothingImage(null); // Deselect uploaded file
  }, []);

  const runGeneration = useCallback(async (pImg: File, cSource: File | string) => {
    setStep('generating');
    setIsLoading(true);
    setError(null);
    setResultImage(null);
    
    try {
      const result = await generateVirtualTryOn(pImg, cSource);
      setResultImage(result);
      setStep('result');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка.';
      setError(`Не удалось сгенерировать изображение. ${errorMessage}`);
      setStep('error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!personImage) {
      setError("Пожалуйста, загрузите ваше фото.");
      setStep('error');
      return;
    }
    if (!clothingImage && !selectedOutfitUrl) {
      setError("Пожалуйста, загрузите фото одежды или выберите готовый образ.");
      setStep('error');
      return;
    }

    const clothingSource = clothingImage || selectedOutfitUrl;
    if (clothingSource) {
      runGeneration(personImage, clothingSource);
    }
  }, [personImage, clothingImage, selectedOutfitUrl, runGeneration]);
  
  const handleStartOver = useCallback(() => {
    setPersonImage(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
    setGender(null);
    setSelectedOutfitUrl(null);
    setStep('start');
  }, []);
  
  const handleDownload = useCallback(() => {
    if (resultImage) {
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `style-ai-try-on-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }, [resultImage]);
  
  const renderContent = () => {
    switch (step) {
      case 'error':
        return (
          <div className="text-center animate-fade-in-up bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">Произошла ошибка</h2>
            <p className="text-md text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={handleStartOver}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
            >
              Начать сначала
            </button>
          </div>
        );

      case 'start':
        return <StartScreen onFileSelect={(files) => files && handlePersonImageSelect(files[0])} />;

      case 'gender':
        return <GenderSelector onSelect={handleGenderSelect} />;
      
      case 'clothing':
        return (
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 animate-fade-in-up">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <ImageUploader
                        title="Ваше фото"
                        onFileSelect={handlePersonImageSelect}
                        imageUrl={personImageUrl}
                        disabled={isLoading}
                    />
                    <div className="flex flex-col gap-8 w-full">
                        <ImageUploader
                            title="Фото одежды"
                            onFileSelect={handleClothingImageSelect}
                            imageUrl={clothingImageUrl}
                            disabled={isLoading}
                            helpText="Для лучшего результата используйте качественное фото на светлом фоне."
                        />
                         <button
                            onClick={handleGenerate}
                            disabled={isLoading || !personImage || (!clothingImage && !selectedOutfitUrl)}
                            className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-5 px-12 text-xl rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            >
                            Примерить
                        </button>
                    </div>
                </div>
                {gender && <OutfitGallery 
                    outfits={OUTFITS[gender]} 
                    onSelect={handleOutfitSelect}
                    selectedUrl={selectedOutfitUrl}
                    disabled={isLoading}
                />}
            </div>
        );
      
      case 'generating':
      case 'result':
        return (
            <div className="w-full flex flex-col items-center gap-4 animate-fade-in-up">
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
                            className="text-center bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-gray-200 font-semibold py-3 px-6 rounded-md transition-all duration-200 ease-in-out active:scale-95 text-base"
                        >
                            Начать сначала
                        </button>
                    </div>
                )}
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header />
      <main className={`flex-grow w-full max-w-[1600px] mx-auto p-4 md:p-8 flex justify-center items-center`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;