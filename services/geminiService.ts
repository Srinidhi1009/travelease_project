
import { Place, ChatMessage } from "../types";

/**
 * Local Mock Service for Travel Buddy
 * Provides dynamic responses based on the user's booking context.
 */

const CITY_DATA: Record<string, { places: string[], gates: string[], weather: string }> = {
  'Assam': {
    places: ["Kamakhya Temple", "Kaziranga National Park", "Umananda Island"],
    gates: ["T1 - Gate 24", "T1 - Gate 08"],
    weather: "22°C, Overcast skies"
  },
  'Mumbai': {
    places: ["Gateway of India", "Marine Drive", "Elephanta Caves"],
    gates: ["T2 - Gate 12", "T2 - Gate 45"],
    weather: "31°C, Humid"
  },
  'Delhi': {
    places: ["Red Fort", "Qutub Minar", "India Gate"],
    gates: ["T3 - Gate 18", "T3 - Gate 04"],
    weather: "28°C, Hazy"
  },
  'Bangalore': {
    places: ["Lalbagh Botanical Garden", "Bangalore Palace", "Cubbon Park"],
    gates: ["T1 - Gate 32", "T1 - Gate 15"],
    weather: "24°C, Pleasant"
  },
  'Goa': {
    places: ["Calangute Beach", "Basilica of Bom Jesus", "Dudhsagar Falls"],
    gates: ["T1 - Gate 05", "T1 - Gate 02"],
    weather: "29°C, Sunny"
  },
  'Kerala': {
    places: ["Munnar Tea Gardens", "Alleppey Backwaters", "Varkala Beach"],
    gates: ["T1 - Gate 09", "T2 - Gate 21"],
    weather: "27°C, Tropical"
  }
};

const RESPONSES_TEMPLATE: Record<string, Record<string, string>> = {
  en: {
    'Weather Prediction': "The current environment in {city} is {weather}. Expect stable conditions for the next 48 hours.",
    'Gate Changes': "Your flight to {city} is scheduled at {gate}. Status: {status}. Connectivity stable.",
    'Budget & Expenses': "You have utilized {perc}% of your ₹{budget} budget for {city}. ₹{rem} remaining for this node.",
    'Local Famous Places': "Top nearby nodes in {city}: {places}.",
    'Flight Cancellations & Rebooking': "Operational protocols for {city} detected. Would you like to terminate this node or reroute your journey?",
    'default': "Node connectivity stable. How can I assist with your journey to {city} today?"
  },
  hi: {
    'Weather Prediction': "{city} में वर्तमान वातावरण {weather} है। अगले 48 घंटों तक मौसम स्थिर रहने की संभावना है।",
    'Gate Changes': "{city} के लिए आपकी उड़ान {gate} पर निर्धारित है। स्थिति: {status}।",
    'Budget & Expenses': "आपने {city} के लिए अपने ₹{budget} बजट का {perc}% उपयोग किया है। ₹{rem} शेष हैं।",
    'Local Famous Places': "{city} में शीर्ष स्थान: {places}।",
    'Flight Cancellations & Rebooking': "{city} के लिए परिचालन प्रोटोकॉल का पता चला। क्या आप इस नोड को समाप्त करना चाहेंगे या अपनी यात्रा को फिर से शुरू करना चाहेंगे?",
    'default': "नोड कनेक्टिविटी स्थिर है। आज मैं आपकी {city} यात्रा योजना में आपकी क्या सहायता कर सकता हूँ?"
  },
  te: {
    'Weather Prediction': "{city}లో ప్రస్తుత వాతావరణం {weather}. రాబోయే 48 గంటల వరకు సాధారణ స్థితి అంచనా వేయబడింది.",
    'Gate Changes': "{city}కి మీ విమానం {gate} వద్ద షెడ్యూల్ చేయబడింది. స్థితి: {status}.",
    'Budget & Expenses': "మీరు {city} కోసం మీ ₹{budget} బడ్జెట్‌లో {perc}% ఉపయోగించారు. ₹{rem} మిగిలి ఉన్నాయి.",
    'Local Famous Places': "{city}లోని ప్రముఖ ప్రదేశాలు: {places}.",
    'Flight Cancellations & Rebooking': "{city} కోసం కార్యాచరణ ప్రోటోకాల్‌లు గుర్తించబడ్డాయి. మీరు ఈ నోడ్‌ను రద్దు చేయాలనుకుంటున్నారా లేదా మీ ప్రయాణాన్ని మళ్ళించాలనుకుంటున్నారా?",
    'default': "నోడ్ కనెక్టివిటీ స్థిరంగా ఉంది. ఈరోజు మీ {city} ప్రయాణ మ్యాపింగ్‌లో నేను మీకు ఎలా సహాయం చేయగలను?"
  }
};

export async function chatWithGemini(prompt: string, context: string = '', language: string = 'en'): Promise<{text: string, type: ChatMessage['type']}> {
  await new Promise(r => setTimeout(r, 600));
  
  const lang = language as 'en' | 'hi' | 'te';
  const bookings = JSON.parse(context || '[]');
  const latest = bookings[0] || { destination: 'India', spent: 0, details: { totalBudget: 0 } };
  
  const city = latest.destination;
  const cityInfo = CITY_DATA[city] || { 
    places: ["Local Heritage Sites", "City Center", "Famous Markets"], 
    gates: ["Main Terminal"], 
    weather: "25°C, Normal" 
  };

  const budget = latest.details?.totalBudget || 50000;
  const spent = latest.spent || 0;
  const remaining = budget - spent;
  const perc = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  const responseSet = RESPONSES_TEMPLATE[lang] || RESPONSES_TEMPLATE['en'];
  
  let keyFound = 'default';
  let type: ChatMessage['type'] = 'default';

  if (prompt.toLowerCase().includes('cancel') || prompt.toLowerCase().includes('rebook')) {
    keyFound = 'Flight Cancellations & Rebooking';
    type = 'action_rebook';
  } else {
    for (const key of Object.keys(responseSet)) {
      if (prompt.toLowerCase().includes(key.toLowerCase())) {
        keyFound = key;
        if (key === 'Flight Cancellations & Rebooking') type = 'action_rebook';
        break;
      }
    }
  }

  let text = responseSet[keyFound];
  text = text.replace(/{city}/g, city)
             .replace(/{weather}/g, cityInfo.weather)
             .replace(/{gate}/g, cityInfo.gates[0])
             .replace(/{status}/g, "On Time")
             .replace(/{budget}/g, budget.toLocaleString())
             .replace(/{perc}/g, perc.toString())
             .replace(/{rem}/g, remaining.toLocaleString())
             .replace(/{places}/g, cityInfo.places.join(", "));
  
  return { text, type };
}

export async function exploreLocalPlaces(city: string) {
  return [
    { 
      id: 'm1', 
      name: `${city} Heritage Node`, 
      city, 
      category: 'Heritage', 
      rating: 4.8, 
      reviewsCount: 1200,
      price: 500, 
      img: '', 
      gallery: [],
      tags: ['Verified'],
      aiBadge: 'Top Pick',
      description: 'A globally verified landmark.',
      tips: 'Visit early for best mapping.',
      reviews: []
    },
  ] as Place[];
}
