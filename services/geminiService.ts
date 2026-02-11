import { GoogleGenAI } from "@google/genai";
import { Place, ChatMessage } from "../types";

// Initialize the Google GenAI SDK using process.env.API_KEY as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Advanced Travel Assistant powered by Gemini API.
 * Provides dynamic responses based on the user's journey context.
 */
export async function chatWithGemini(prompt: string, context: string = '', language: string = 'en'): Promise<{text: string, type: ChatMessage['type']}> {
  try {
    // Calling Gemini with the correct model and parameters as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: `Current User Booking Context (JSON): ${context}` },
        { text: `User Query: ${prompt}` }
      ],
      config: {
        systemInstruction: `You are TravelEase AI. Your goal is to provide specific, utility-focused answers based on the user's booking data.
        
        RULES:
        1. ONLY answer the specific question asked. If they ask for weather, talk ONLY about weather. If gate, ONLY gate.
        2. BE CONCISE. Do not provide a "Strategic Overview" or a full summary unless explicitly asked for a full status report.
        3. WEATHER: Use the destination in the context. Assam is usually cool/dry in Jan. Use realistic weather logic for Indian cities.
        4. GATES: If a booking is active, give a realistic gate number (e.g., Gate 42B, Terminal 2).
        5. BUDGET: Calculate spent vs remaining based on the context JSON. Be precise with the numbers provided.
        6. LOCAL PLACES: Suggest 3 specific attractions in the destination city (e.g., for Assam suggest Kaziranga, Kamakhya Temple).
        7. ACTIONS (Rebook/Cancel): ONLY set the response type to 'action_rebook' if the user explicitly asks to cancel, change, or rebook their trip. Do not include rebook/cancel buttons for general questions about weather or gates.
        8. STYLE: Professional, futuristic travel terminal aesthetic. No generic "Uplink Established" headers every time.
        9. Language: Respond in ${language}.`,
      },
    });

    const text = response.text || "Communication timeout. Please retry.";
    
    // Logic to determine if we should show the rebook/cancel buttons
    let type: ChatMessage['type'] = 'default';
    const lowerPrompt = prompt.toLowerCase();
    
    // Only trigger rebook/cancel UI if user intent is specifically about modification or termination
    if (lowerPrompt.includes('cancel') || lowerPrompt.includes('rebook') || 
        lowerPrompt.includes('modify') || lowerPrompt.includes('terminate') || 
        lowerPrompt.includes('change my trip')) {
      type = 'action_rebook';
    }

    return { text, type };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Uplink failure. Node connectivity lost.", type: 'default' };
  }
}

/**
 * Suggests real local attractions using Gemini's knowledge base.
 */
export async function exploreLocalPlaces(city: string): Promise<Place[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 real famous tourist attractions in ${city}, India. Output only the names, comma-separated.`,
    });
    
    const text = response.text || "";
    const placeNames = text.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const finalNames = placeNames.length > 0 ? placeNames : [`${city} Landmark`];
    
    return finalNames.map((name, i) => ({ 
      id: `ai-node-${i}-${Date.now()}`, 
      name: name, 
      city, 
      category: i % 2 === 0 ? 'Heritage' : 'Experiences', 
      rating: 4.6 + (i * 0.1), 
      reviewsCount: 1200 + (i * 450),
      price: 500 + (i * 200), 
      img: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=500', 
      gallery: [],
      tags: ['Verified', 'AI Pick'],
      aiBadge: 'Top Tier',
      description: 'An AI-verified high-traffic node in the regional grid.',
      tips: 'Engage with local guides for enhanced data synchronization.',
      reviews: []
    }));
  } catch (error) {
    return [
      { 
        id: 'fallback-node', 
        name: `${city} Hub`, 
        city, 
        category: 'Heritage', 
        rating: 4.8, 
        reviewsCount: 1200,
        price: 500, 
        img: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=500', 
        gallery: [],
        tags: ['Verified'],
        aiBadge: 'Top Pick',
        description: 'A globally verified landmark.',
        tips: 'Visit early for best mapping.',
        reviews: []
      },
    ];
  }
}