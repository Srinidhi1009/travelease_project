
export type Language = 'en' | 'te' | 'hi';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'partly-cloudy';

export interface DayForecast {
  date: string;
  condition: WeatherCondition;
  temp: number;
  isAlert?: boolean;
}

export type PlaceCategory = 'Heritage' | 'Food' | 'Shopping' | 'Nature' | 'Experiences' | 'Hotel' | 'Flight' | 'Cab';

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Place {
  id: string;
  name: string;
  city: string;
  category: PlaceCategory;
  rating: number;
  reviewsCount: number;
  price: number;
  img: string;
  gallery: string[];
  tags: string[];
  aiBadge: string;
  description: string;
  tips: string;
  reviews: Review[];
}

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'cab' | 'bundle';
  destination: string;
  date: string;
  spent: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  mode: 'manual' | 'automatic';
  details?: {
    origin?: string;
    totalBudget?: number;
    class?: string;
    roomType?: string;
    cabType?: string;
    seats?: string[];
    pickup?: string;
    dropoff?: string;
    dietary?: string;
    preference?: string;
    departureDate?: string;
    returnDate?: string;
    checkInDate?: string;
    checkOutDate?: string;
    tripType?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isNearbyResult?: boolean;
  places?: Place[];
  type?: 'default' | 'action_rebook';
}

export interface AIPlannerState {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  duration: number;
  travelStyle: 'budget' | 'comfort' | 'luxury';
  interests: string[];
  dietary: 'veg' | 'non-veg';
  preference: 'window' | 'aisle' | 'none';
}
