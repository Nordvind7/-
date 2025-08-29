/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import type { Handler } from '@netlify/functions';

// This function is defined outside the handler to be reusable.
const handleApiResponse = (
    response: GenerateContentResponse,
    context: string
): { mimeType: string, data: string } => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        throw new Error(`Запрос заблокирован. Причина: ${blockReason}. ${blockReasonMessage || ''}`);
    }

    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        // Fix: Ensure mimeType exists, as it's optional in the type definition.
        const { data, mimeType } = imagePartFromResponse.inlineData;
        if (mimeType) {
            return { data, mimeType };
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`Генерация изображения прервалась. Причина: ${finishReason}.`);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `Модель ИИ не вернула изображение для '${context}'. ` +
        (textFeedback 
            ? `Модель ответила текстом: "${textFeedback}"`
            : "Это может произойти из-за фильтров безопасности.");

    throw new Error(errorMessage);
};

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is not set in Netlify environment variables.");
        const errorMessage = "Ошибка конфигурации сервера: переменная окружения API_KEY не найдена. Убедитесь, что в настройках вашего сайта на Netlify (в разделе 'Site configuration' -> 'Environment variables') вы добавили переменную с именем ровно 'API_KEY' и вашим ключом в качестве значения.";
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: errorMessage,
                errorCode: "MISSING_API_KEY"
            }),
        };
    }

    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Пустое тело запроса.' }) };
        }

        const { personImage, clothingImage } = JSON.parse(event.body);

        if (!personImage || !clothingImage) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Отсутствуют изображения в запросе.' }) };
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const personImagePart = { inlineData: personImage };
        const clothingImagePart = { inlineData: clothingImage };

        const prompt = `Вы — экспертный AI-стилист. Ваша задача — взять одежду со второго изображения и реалистично «надеть» её на человека с первого изображения.

Инструкции:
1.  **Определите человека** на первом изображении и его позу.
2.  **Определите основной предмет(ы) одежды** на втором изображении.
3.  **Совместите их**: Наденьте одежду на человека. Одежда должна адаптироваться к форме тела, осанке и позе человека. Она должна выглядеть естественно, с реалистичными складками, тенями и морщинами.
4.  **Сохраните исходного человека**: Голова, руки, волосы, тон кожи и любые видимые части тела человека, не покрытые новой одеждой, должны остаться без изменений, как на первом изображении.
5.  **Сохраните фон**: Фон с первого изображения должен быть сохранён в точности.
6.  **Результат**: Верните ТОЛЬКО итоговое, совмещённое изображение. Не добавляйте в свой ответ никакого текста.`;
        
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [personImagePart, clothingImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const result = handleApiResponse(response, 'виртуальная примерка');

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error instanceof Error ? error.message : "Произошла неизвестная ошибка на сервере." }),
        };
    }
};