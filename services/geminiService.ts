/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Helper function to convert a File object to a base64 string with mime type
const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string; }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Неверный URL данных");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Не удалось извлечь MIME-тип из URL данных");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { mimeType, data };
};


/**
 * Sends images to a serverless function to generate a virtual try-on image.
 * @param personImage The image file of the person.
 * @param clothingImage The image file of the clothing.
 * @returns A promise that resolves to the data URL of the combined image.
 */
export const generateVirtualTryOn = async (
    personImage: File,
    clothingImage: File,
): Promise<string> => {
    console.log('Подготовка изображений для отправки на серверную функцию...');
    const personImagePart = await fileToGenerativePart(personImage);
    const clothingImagePart = await fileToGenerativePart(clothingImage);

    console.log('Отправка запроса на Netlify Function...');
    const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personImage: personImagePart,
            clothingImage: clothingImagePart,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
            error: `Сервер вернул ошибку ${response.status}. Пожалуйста, проверьте консоль серверной функции в Netlify.` 
        }));
        
        const error = new Error(errorData.error || 'Произошла неизвестная ошибка на сервере.');
        // Attach the error code if it exists, so the UI can react to it.
        if (errorData.errorCode) {
            (error as any).code = errorData.errorCode;
        }
        throw error;
    }

    const result = await response.json();
    console.log('Получен успешный ответ от серверной функции.');
    return `data:${result.mimeType};base64,${result.data}`;
};