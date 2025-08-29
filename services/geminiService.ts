/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
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
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "virtual try-on"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Запрос заблокирован. Причина: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Получены данные изображения (${mimeType}) для ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Генерация изображения для '${context}' неожиданно прервалась. Причина: ${finishReason}. Часто это связано с настройками безопасности.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `Модель ИИ не вернула изображение для '${context}'. ` +
        (textFeedback 
            ? `Модель ответила текстом: "${textFeedback}"`
            : "Это может произойти из-за фильтров безопасности или слишком сложного запроса. Попробуйте другое изображение или измените запрос.");

    console.error(`Ответ модели не содержит изображения для '${context}'.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates a virtual try-on image by combining a person's photo with a clothing photo.
 * @param personImage The image file of the person.
 * @param clothingImage The image file of the clothing.
 * @returns A promise that resolves to the data URL of the combined image.
 */
export const generateVirtualTryOn = async (
    personImage: File,
    clothingImage: File,
): Promise<string> => {
    console.log('Начало генерации виртуальной примерки...');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const personImagePart = await fileToPart(personImage);
    const clothingImagePart = await fileToPart(clothingImage);

    const prompt = `Вы — экспертный AI-стилист. Ваша задача — взять одежду со второго изображения и реалистично «надеть» её на человека с первого изображения.

Инструкции:
1.  **Определите человека** на первом изображении и его позу.
2.  **Определите основной предмет(ы) одежды** на втором изображении.
3.  **Совместите их**: Наденьте одежду на человека. Одежда должна адаптироваться к форме тела, осанке и позе человека. Она должна выглядеть естественно, с реалистичными складками, тенями и морщинами.
4.  **Сохраните исходного человека**: Голова, руки, волосы, тон кожи и любые видимые части тела человека, не покрытые новой одеждой, должны остаться без изменений, как на первом изображении.
5.  **Сохраните фон**: Фон с первого изображения должен быть сохранён в точности.
6.  **Результат**: Верните ТОЛЬКО итоговое, совмещённое изображение. Не добавляйте в свой ответ никакого текста.`;
    
    const textPart = { text: prompt };

    console.log('Отправка изображений и запроса модели...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [personImagePart, clothingImagePart, textPart] },
    });
    console.log('Получен ответ от модели.', response);

    return handleApiResponse(response, 'виртуальная примерка');
};