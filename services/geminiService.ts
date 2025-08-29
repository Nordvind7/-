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
 * Sends images to the Netlify serverless function to generate a virtual try-on image.
 * @param personImage The image file of the person.
 * @param clothingSource The image file or URL of the clothing.
 * @returns A promise that resolves to the data URL of the combined image.
 */
export const generateVirtualTryOn = async (
    personImage: File,
    clothingSource: File | string,
): Promise<string> => {
    const personImagePart = await fileToGenerativePart(personImage);

    let clothingImagePart;
    if (typeof clothingSource === 'string') {
        try {
            const response = await fetch(clothingSource);
            if (!response.ok) {
                throw new Error(`Не удалось загрузить изображение по URL: ${response.statusText}`);
            }
            const blob = await response.blob();
            const file = new File([blob], "outfit.jpg", { type: blob.type });
            clothingImagePart = await fileToGenerativePart(file);
        } catch (e) {
            console.error("Ошибка при загрузке изображения из галереи:", e);
            throw new Error("Не удалось загрузить выбранный образ. Проверьте ссылку или попробуйте другой.");
        }
    } else {
        clothingImagePart = await fileToGenerativePart(clothingSource);
    }

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

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Произошла ошибка на сервере.');
    }

    if (result.mimeType && result.data) {
        return `data:${result.mimeType};base64,${result.data}`;
    } else {
        throw new Error('Сервер вернул некорректный ответ.');
    }
};
