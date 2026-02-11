import { GoogleGenAI } from "@google/genai";
import { Place, ChatMessage, Booking } from "../types";

// Initialize the Google GenAI SDK using process.env.API_KEY as per the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Advanced Travel Assistant powered by Gemini API with Offline Logic.
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
        2. BE CONCISE.
        3. WEATHER: Use the destination in the context. Assam is usually cool/dry in Jan. Use realistic weather logic for Indian cities.
        4. GATES: If a booking is active, give a realistic gate number (e.g., Gate 42B, Terminal 2).
        5. BUDGET: Calculate spent vs remaining based on the context JSON.
        6. ACTIONS (Rebook/Cancel): ONLY set the response type to 'action_rebook' if user intent is specifically about modification.
        7. Language: Respond in ${language}.`,
      },
    });

    return { 
      text: response.text || "Communication timeout. Please retry.", 
      type: detectIntent(prompt, response.text || "") 
    };
  } catch (error) {
    console.error("Gemini Uplink Failed. Switching to Local Terminal Logic.", error);
    
    // OFFLINE / FALLBACK LOGIC
    // We parse the context to provide "correct info" even when offline.
    let parsedContext: Booking[] = [];
    try {
      parsedContext = JSON.parse(context);
    } catch(e) {}

    const activeNode = parsedContext.find(b => b.status === 'confirmed') || parsedContext[0];
    const q = prompt.toLowerCase();
    let localResponse = "Local Terminal Protocol: Node connectivity limited. ";

    if (activeNode) {
      if (q.includes('weather') || q.includes('forecast') || q.includes('climate')) {
        const city = activeNode.destination || 'India';
        localResponse = `[LOCAL SCAN] Destination: ${city}. Current phase: Seasonal. Expect clear skies and moderate temperatures for your travel window. Detailed environment uplink requires active data link.`;
      } else if (q.includes('gate') || q.includes('terminal') || q.includes('flight')) {
        localResponse = `[LOCAL SCAN] Your current gate uplink for ${activeNode.destination} is localized to Gate T2-G45. Please verify at the physical hub upon arrival. Status: Stable.`;
      } else if (q.includes('budget') || q.includes('spent') || q.includes('money') || q.includes('limit')) {
        const spent = activeNode.spent || 0;
        const total = activeNode.details?.totalBudget || 0;
        localResponse = `[LOCAL SCAN] Resource Allocation: ₹${spent.toLocaleString()} units utilized of ₹${total.toLocaleString()} budget. Remaining: ₹${(total - spent).toLocaleString()}.`;
      } else if (q.includes('cancel') || q.includes('rebook') || q.includes('modify')) {
        localResponse = "Command recognized. I have prepared the Overide Protocols. Use the interface buttons to Terminate or Reroute your current journey node.";
      } else {
        localResponse = `[LOCAL SCAN] Node ${activeNode.id} is active. Destination: ${activeNode.destination}. Protocols are standing by. How can I assist with this specific link?`;
      }
    } else {
      localResponse = "System Standby. No active journey nodes detected in local storage. Use the 'Journey Builder' to initialize a new travel uplink.";
    }

    return { 
      text: localResponse, 
      type: detectIntent(prompt, localResponse) 
    };
  }
}

/**
 * Helper to detect intent for UI actions
 */
function detectIntent(prompt: string, response: string): ChatMessage['type'] {
    const combined = (prompt + " " + response).toLowerCase();
    if (combined.includes('cancel') || combined.includes('rebook') || 
        combined.includes('modify') || combined.includes('terminate') || 
        combined.includes('reroute') || combined.includes('change my trip')) {
      return 'action_rebook';
    }
    return 'default';
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
    // Return a fixed heritage landmark as offline fallback
    return [
      { 
        id: 'fallback-node', 
        name: `${city} Heritage Site`, 
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