/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import type { Handler } from '@netlify/functions';

// This function is defined outside the handler to be reusable.
const handleApiResponse = (
    response: GenerateContentResponse
): { mimeType: string, data: string } => {
    // Check for explicit blocking by safety filters or other reasons.
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        throw new Error(`Запрос заблокирован. Причина: ${blockReason}. ${blockReasonMessage || ''}`);
    }

    // Find the first part in the response that contains image data.
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData)?.inlineData;

    // If an image part is found, return its data and MIME type.
    if (imagePart?.data && imagePart?.mimeType) {
        return { data: imagePart.data, mimeType: imagePart.mimeType };
    }
    
    // If no image is returned, check for other reasons for termination.
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`Генерация изображения прервалась. Причина: ${finishReason}.`);
    }
    
    // If no image and no clear error, construct a helpful message, including any text response.
    const textFeedback = response.text?.trim();
    const errorMessage = "Модель ИИ не вернула изображение. " +
        (textFeedback 
            ? `Вместо этого она ответила текстом: "${textFeedback}"`
            : "Это может быть связано с внутренними фильтрами безопасности или сложностью запроса.");

    throw new Error(errorMessage);
};

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is not set in Netlify environment variables.");
        const errorMessage = "Ошибка конфигурации сервера: переменная окружения API_KEY не найдена. Убедитесь, что в настройках вашего сайта на Netlify (в разделе 'Site configuration' -> 'Environment variables') вы добавили переменную с именем ровно 'API_KEY' и вашим ключом в качестве значения, а затем заново развернули сайт (re-deploy).";
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

        const prompt = `You are an expert virtual stylist AI. Your task is to perform a high-fidelity virtual try-on, replacing the person's current outfit with a new one.

**INPUT:**
- Image 1: A photo of a person wearing an article of clothing.
- Image 2: A photo of a single clothing item.

**INSTRUCTIONS:**
1.  **Analyze Person:** Identify the person's pose, body shape, and the lighting in Image 1.
2.  **Isolate New Clothing:** Precisely isolate the clothing item from Image 2, ignoring any background or mannequins.
3.  **Replace and Fit:** You MUST COMPLETELY REMOVE the primary clothing item (e.g., shirt, jacket, dress) the person is currently wearing in Image 1. Then, realistically place and drape the new clothing item from Image 2 onto the person.
    - The new clothing must conform to the person's body contours, pose, and posture naturally.
    - Create realistic wrinkles, folds, and shadows on the new clothing that are consistent with the person's pose and the lighting from Image 1.
4.  **Preserve Identity & Background:** CRITICAL - The person's original head, face, hair, skin tone, and any visible body parts (like hands or legs) not covered by the new clothing MUST remain completely unchanged from Image 1. The background from Image 1 must also be fully preserved.
5.  **Seamless Integration:** Ensure the final image is photorealistic and seamless. The lighting on the new clothing should match the ambient lighting of Image 1 perfectly.

**OUTPUT:**
- Return ONLY the final, edited image. Do not include any text, explanations, or additional content in your response.`;
        
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [personImagePart, clothingImagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const result = handleApiResponse(response);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
        };

    } catch (error) {
        console.error("Error in Netlify function:", JSON.stringify(error, null, 2));
        let errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка на сервере.";
        
        if (errorMessage.includes("API key not valid")) {
             return {
                statusCode: 401,
                body: JSON.stringify({ error: "API-ключ недействителен. Пожалуйста, проверьте ключ в переменных окружения Netlify." }),
            };
        }
        
        if (errorMessage.includes("did not match the expected pattern")) {
            errorMessage = "Произошла ошибка при обработке одного из изображений. Пожалуйста, попробуйте использовать другое фото с хорошим освещением и четким фокусом, где объект хорошо виден.";
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
};