
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, Booking, Place, Language } from './types';
import { TRANSLATIONS } from './constants';
import { chatWithGemini } from './services/geminiService';
import { 
  Plane, MessageSquare, Sun, Loader2, Plus,
  XCircle, MapPin, Star, Home as HomeIcon, 
  Briefcase, User as ProfileIcon, ChevronLeft, Sparkles, 
  Clock, ShieldCheck, Zap, Settings, LogOut, Trash2, 
  Radar, Wallet, Utensils, Landmark, Send, CreditCard, 
  Smartphone, Banknote, ShieldAlert, Calendar, Navigation, 
  Moon, Building2, MapPinned, Info as InfoIcon,
  ChevronRight, CheckCircle, BarChart3, Cloud, Edit3, Trash
} from 'lucide-react';

// --- Dynamic Pricing Engine ---
const getDynamicPrice = (type: 'flight' | 'hotel' | 'cab', base: number, city: string, slot: string, tier: string) => {
  let multiplier = 1.0;
  const metros = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];
  if (metros.includes(city)) multiplier *= 1.4;
  else multiplier *= 0.9;
  if (slot === 'early' || slot === 'late') multiplier *= 0.8;
  if (slot === 'morning' || slot === 'evening') multiplier *= 1.3;
  const tiers: Record<string, number> = {
    'economy': 1, 'premium': 1.5, 'business': 2.5, 'first': 4.5,
    'standard': 1, 'deluxe': 1.6, 'suite': 2.8, 'presidential': 5.5,
    'auto': 0.5, 'sedan': 1.2, 'suv': 1.8, 'luxury': 3.5
  };
  multiplier *= (tiers[tier.toLowerCase()] || 1);
  return Math.round(base * multiplier);
};

const MainApp = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('travel_ease_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [lang, setLang] = useState<Language>('en');
  const [tab, setTab] = useState<'home' | 'trips' | 'chat' | 'profile'>('home');
  const [bookingMode, setBookingMode] = useState<'none' | 'ai' | 'manual'>('none');
  const [rebookData, setRebookData] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; data: any } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('travel_ease_bookings');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeBookingId, setActiveBookingId] = useState<string | null>(() => {
    const saved = localStorage.getItem('travel_ease_bookings');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 ? parsed[0].id : null;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const t = (key: string) => (TRANSLATIONS[lang] as any)[key] || key;

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const activeBooking = bookings.find(b => b.id === activeBookingId) || bookings[0];

  const handleBookingComplete = () => {
    if (!paymentDetails) return;
    const newBooking: Booking = { 
      id: Date.now().toString(), 
      type: 'bundle', 
      destination: paymentDetails.data.destination || 'Assam', 
      date: paymentDetails.data.departureDate || '2026-01-21', 
      spent: paymentDetails.amount, 
      status: 'confirmed', 
      mode: bookingMode === 'ai' ? 'automatic' : 'manual',
      details: {
        ...paymentDetails.data,
        totalBudget: paymentDetails.data.budget
      }
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem('travel_ease_bookings', JSON.stringify(updated));
    setActiveBookingId(newBooking.id);
    setPaymentDetails(null);
    setBookingMode('none');
    setRebookData(null);
    setTab('home');
  };

  const cancelBooking = (id: string) => {
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    setBookings(updated);
    localStorage.setItem('travel_ease_bookings', JSON.stringify(updated));
  };

  const startRebooking = (booking: Booking) => {
    setRebookData(booking.details);
    setBookingMode('manual');
  };

  if (!user) return <AuthWrapper onLogin={(u: any) => { setUser(u); localStorage.setItem('travel_ease_user', JSON.stringify(u)); }} lang={lang} setLang={setLang} t={t} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full max-w-lg mx-auto overflow-hidden relative border-x border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-500">
      <main className="flex-1 overflow-y-auto p-6 no-scrollbar pb-32 space-y-10">
        {tab === 'home' ? (
          <Dashboard 
            user={user} 
            bookings={bookings} 
            activeBookingId={activeBookingId}
            setActiveBookingId={setActiveBookingId}
            setBookingMode={setBookingMode} 
            setRebookData={setRebookData}
            lang={lang} 
            setLang={setLang} 
            t={t} 
          />
        ) : tab === 'trips' ? (
          <TripsTab bookings={bookings} onCancel={cancelBooking} onRebook={startRebooking} t={t} />
        ) : tab === 'chat' ? (
          <ChatBuddy activeBooking={activeBooking} lang={lang} t={t} onCancel={cancelBooking} onRebook={startRebooking} />
        ) : (
          <ProfileTab user={user} setUser={setUser} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
        )}
      </main>

      <nav className="fixed bottom-6 inset-x-6 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-around px-4 shadow-2xl z-[110] border border-white/20 dark:border-slate-800">
        {[ {id:'home', icon:<HomeIcon size={22}/>}, {id:'trips', icon:<Briefcase size={22}/>}, {id:'chat', icon:<MessageSquare size={22}/>}, {id:'profile', icon:<ProfileIcon size={22}/>} ].map(item => (
          <button key={item.id} onClick={()=>{setTab(item.id as any); setBookingMode('none');}} className={`p-4 rounded-2xl transition-all duration-300 ${tab === item.id ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>{item.icon}</button>
        ))}
        <button onClick={() => setBookingMode('ai')} className="p-4 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/30 active:scale-90 transition-transform">
          <Sparkles size={22} />
        </button>
      </nav>

      {bookingMode === 'manual' && <ManualJourneyBuilder initialData={rebookData} onClose={()=>{setBookingMode('none'); setRebookData(null);}} onBook={(amt, data)=>setPaymentDetails({amount: amt, data})} t={t}/>}
      {bookingMode === 'ai' && <AIPlanner onClose={()=>setBookingMode('none')} onComplete={(amt, data)=>setPaymentDetails({amount: amt, data})} t={t}/>}
      {paymentDetails && <PaymentScreen amount={paymentDetails.amount} onCancel={()=>setPaymentDetails(null)} onComplete={handleBookingComplete} t={t} />}
    </div>
  );
};

const Dashboard = ({ user, bookings, activeBookingId, setActiveBookingId, setBookingMode, setRebookData, lang, setLang, t }: any) => {
  const activeBooking = bookings.find((b: any) => b.id === activeBookingId) || bookings[0];
  const budget = activeBooking?.details?.totalBudget || 0;
  const spent = activeBooking?.spent || 0;
  const remaining = budget - spent;
  const utilPerc = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('welcome')}{user.username}</h1>
          <p className="text-[11px] font-bold text-slate-400">Smart location-aware travel booking.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setBookingMode('manual')} className="px-5 py-2.5 bg-primary-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95 transition-all">
            <Plane size={14} /> {t('manualBooking')}
          </button>
          <button onClick={() => setBookingMode('ai')} className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <Sparkles size={14} className="text-primary-400" /> AI Builder
          </button>
        </div>
      </div>

      {activeBooking && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-primary-500/20 dark:border-primary-500/40 shadow-xl space-y-6 animate-in zoom-in-95 duration-500 ring-4 ring-primary-500/5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">{activeBooking.details?.origin} → {activeBooking.destination}</h2>
              <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Active Node: {activeBooking.id}</p>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-primary-600 font-black text-xl">₹</span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${activeBooking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{activeBooking.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50">
              <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{t('budgetLabel')}</p>
              <p className="text-lg font-black text-slate-800 dark:text-white">₹{budget.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100/30">
              <p className="text-[8px] font-black uppercase text-primary-600 mb-1">Total Spent</p>
              <p className="text-lg font-black text-primary-700 dark:text-primary-400">₹{spent.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/30">
              <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">Remaining</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">₹{remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
              <span>Budget Utilization</span>
              <span>{utilPerc}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 transition-all duration-1000" style={{width: `${utilPerc}%`}} />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Navigation size={18} className="text-primary-600" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">Active Node Tracking</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-400">{t('weatherTitle')}</p>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white">22°</h4>
              <p className="text-[10px] font-bold text-slate-400 truncate w-24">{activeBooking ? activeBooking.destination : 'Cloudy'} • Forecast</p>
            </div>
            <Sun className="text-amber-400" size={32} />
          </div>
          <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-rose-500">Live</p>
              <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase flex items-center gap-1">
                <Radar size={12} className="text-primary-600"/> GATE INFO
              </h4>
              <p className="text-[10px] font-bold text-emerald-500 uppercase">ON TIME</p>
            </div>
            <div className="text-right">
              <Clock className="text-rose-200 ml-auto mb-1" size={24} />
              <p className="text-xs font-black text-slate-800 dark:text-white">{activeBooking ? 'T1-G24' : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-primary-600" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Regional Experience</h3>
          </div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('language')}: {lang.toUpperCase()}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'en', label: 'English', sub: 'DEFAULT' },
            { id: 'hi', label: 'हिन्दी', sub: 'HINDI' },
            { id: 'te', label: 'తెలుగు', sub: 'TELUGU' }
          ].map(l => (
            <button key={l.id} onClick={() => setLang(l.id as any)} className={`p-5 rounded-3xl border transition-all flex flex-col items-center gap-1 ${lang === l.id ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-200'}`}>
              <span className="text-sm font-black">{l.label}</span>
              <span className={`text-[7px] font-black uppercase ${lang === l.id ? 'text-white/60' : 'text-slate-400'}`}>{l.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {activeBooking && activeBooking.status !== 'cancelled' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle size={18} className="text-emerald-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-white">Itinerary Benchmarks</h3>
          </div>
          
          <BenchmarkGraph 
            title="Flight" 
            sub={`${activeBooking.details?.class || 'ECONOMY'} • WINDOW`} 
            time="06:15 AM → 08:45 AM" 
            paid={activeBooking.spent * 0.48} 
            saved={(activeBooking.spent * 0.48) * 0.15} 
            icon={<Plane className="text-primary-600" size={18} />}
            data={[
              { label: 'TravelEase', val: activeBooking.spent * 0.48, active: true },
              { label: 'Skyscanner', val: (activeBooking.spent * 0.48) * 1.2 },
              { label: 'Cleartrip', val: (activeBooking.spent * 0.48) * 1.15 },
              { label: 'Google Flights', val: (activeBooking.spent * 0.48) * 1.18 }
            ]}
          />

          <BenchmarkGraph 
            title="Hotel" 
            paid={activeBooking.spent * 0.46} 
            saved={(activeBooking.spent * 0.46) * 0.2} 
            icon={<Building2 className="text-primary-600" size={18} />}
            data={[
              { label: 'TravelEase', val: activeBooking.spent * 0.46, active: true },
              { label: 'MakeMyTrip', val: (activeBooking.spent * 0.46) * 1.25 },
              { label: 'Goibibo', val: (activeBooking.spent * 0.46) * 1.3 },
              { label: 'Agoda', val: (activeBooking.spent * 0.46) * 1.1 }
            ]}
          />

          <BenchmarkGraph 
            title="Cab" 
            paid={activeBooking.spent * 0.06} 
            saved={(activeBooking.spent * 0.06) * 0.3} 
            icon={<CreditCard className="text-primary-600" size={18} />}
            data={[
              { label: 'TravelEase', val: activeBooking.spent * 0.06, active: true },
              { label: 'Uber', val: (activeBooking.spent * 0.06) * 1.4 },
              { label: 'Rapido', val: (activeBooking.spent * 0.06) * 1.35 },
              { label: 'InDrive', val: (activeBooking.spent * 0.06) * 1.45 }
            ]}
          />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 dark:text-white px-1">Upcoming Indian Journeys</h3>
        <p className="text-[9px] font-bold text-slate-400 px-1 uppercase tracking-widest">Tap to sync widgets with a journey node</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2">
          {bookings.map((b: any) => (
            <div 
              key={b.id} 
              onClick={() => setActiveBookingId(b.id)}
              className={`min-w-[280px] p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer shadow-sm space-y-4 ${activeBookingId === b.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-primary-600/10' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-200'}`}
            >
              <div className="flex justify-between items-center">
                <div className={`p-2.5 rounded-xl ${activeBookingId === b.id ? 'bg-primary-600 text-white' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'}`}><Plane size={20}/></div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">{b.date}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{b.status}</span>
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">{b.details?.origin} → {b.destination}</h4>
              <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                <span>Budget: ₹{b.details?.totalBudget?.toLocaleString() || '60,000'}</span>
                <span>Spent: ₹{b.spent.toLocaleString()}</span>
              </div>
            </div>
          ))}

          <button onClick={() => { setRebookData(null); setBookingMode('manual'); }} className="min-w-[280px] p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 group transition-all hover:bg-slate-100">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Plus size={28} className="text-slate-400" /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('manualBooking')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const BenchmarkGraph = ({ title, sub, time, paid, saved, icon, data }: any) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxVal = Math.max(...data.map((d: any) => d.val));

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">{icon}</div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white">{title}</h4>
            {sub && <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{sub}</p>}
            {time && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{time}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Price Paid</p>
          <p className="text-lg font-black text-slate-800 dark:text-white">₹{paid.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Price Benchmarking</p>
          <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            <Sparkles size={10} />
            <span className="text-[8px] font-black uppercase">Saved ₹{saved.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-24 px-2 gap-4 relative">
          {data.map((d: any) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end" onMouseEnter={() => setHovered(d.label)} onMouseLeave={() => setHovered(null)}>
              <div className="relative w-full flex items-end justify-center" style={{height: `${(d.val / maxVal) * 100}%`}}>
                {hovered === d.label && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-lg font-black z-20 whitespace-nowrap animate-in fade-in zoom-in-95">
                    ₹{d.val.toLocaleString()}
                  </div>
                )}
                <div className={`w-full max-w-[40px] rounded-t-lg transition-all duration-700 h-full ${d.active ? 'bg-primary-600 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300'}`} />
              </div>
              <span className={`text-[7px] font-black uppercase truncate w-full text-center ${d.active ? 'text-primary-600' : 'text-slate-400'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ManualJourneyBuilder = ({ onClose, onBook, t, initialData }: any) => {
  const [showSeats, setShowSeats] = useState(false);
  const [data, setData] = useState(initialData || {
    budget: 60000, tripType: 'oneway', class: 'Economy', destination: 'Assam', origin: 'Mumbai', departureDate: '2026-01-21', returnDate: '', checkInDate: '2026-01-21', checkOutDate: '2026-01-25', slot: 'early', preference: 'Window', diet: 'Vegetarian', passengers: 1, hotelId: 'h-1', rooms: 1, roomType: 'standard', cabId: 'suv', pickup: 'Airport', dropoff: 'Hotel', selectedSeats: [] as string[]
  });

  const slots = [
    { id: 'early', label: 'EARLY BIRD', time: '06:15 AM', arr: '08:45 AM' },
    { id: 'morning', label: 'MORNING', time: '10:30 AM', arr: '01:00 PM' },
    { id: 'afternoon', label: 'AFTERNOON', time: '02:15 PM', arr: '04:45 PM' },
    { id: 'evening', label: 'EVENING', time: '05:30 PM', arr: '08:00 PM' },
    { id: 'late', label: 'LATE NIGHT', time: '10:45 PM', arr: '01:15 AM' },
  ];
  const flightPrice = getDynamicPrice('flight', 3500, data.destination, data.slot, data.class);
  const hotelPrice = getDynamicPrice('hotel', 2500, data.destination, data.slot, data.roomType);
  const cabPrice = getDynamicPrice('cab', 900, data.destination, data.slot, data.cabId);
  const total = (flightPrice * data.passengers * (data.tripType === 'round' ? 2 : 1)) + (hotelPrice * data.rooms) + cabPrice;

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col p-8 animate-in slide-in-from-bottom-full overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-transform active:scale-90"><XCircle/></button>
        <div className="text-center">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('manualBooking')}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase">Real-time dynamic Indian pricing.</p>
        </div>
        <div className="w-12"/>
      </header>
      
      <div className="p-8 bg-primary-50 dark:bg-primary-900/10 rounded-[2.5rem] text-center mb-8 border border-primary-100/30">
        <p className="text-[10px] font-black uppercase text-primary-600 mb-2">{t('budgetLabel')} (₹0 - ₹1Cr)</p>
        <div className="flex items-center gap-4 justify-center">
          <input type="range" min="0" max="10000000" step="10000" value={data.budget} onChange={(e)=>setData({...data, budget: parseInt(e.target.value)})} className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary-600" />
          <span className="text-2xl font-black text-primary-700">₹{data.budget.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-10 pb-24">
        <div className="space-y-4">
          <div className="flex gap-2">
            {['oneway', 'round', 'multi'].map(type => (
              <button key={type} onClick={()=>setData({...data, tripType: type})} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${data.tripType === type ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 opacity-60'}`}>{t(type)}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {['Economy', 'Business', 'First'].map(cls => (
              <button key={cls} onClick={()=>setData({...data, class: cls})} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${data.class === cls ? 'bg-primary-600 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 opacity-60'}`}>{cls}</button>
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] space-y-8 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 ml-2"><Plane size={20} className="text-primary-600"/><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">FLIGHT DETAILS</h4></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Flying From</label>
              <input value={data.origin} onChange={(e)=>setData({...data, origin: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" placeholder="Origin City" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Destination</label>
              <input 
                value={data.destination} 
                onChange={(e)=>setData({...data, destination: e.target.value})} 
                className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" 
                placeholder="Target City" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Departure Date</label>
              <input type="date" value={data.departureDate} onChange={(e)=>setData({...data, departureDate: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" />
            </div>
            {data.tripType === 'round' && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Return Date</label>
                <input type="date" value={data.returnDate} onChange={(e)=>setData({...data, returnDate: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Time Slot</label>
            <div className="grid grid-cols-2 gap-3">
              {slots.map(slot => (
                <button key={slot.id} onClick={()=>setData({...data, slot: slot.id})} className={`p-5 rounded-3xl text-left transition-all ${data.slot === slot.id ? 'bg-primary-600 text-white shadow-xl scale-105' : 'bg-white dark:bg-slate-800 opacity-60'}`}>
                  <p className="text-[9px] font-black uppercase">{slot.label}</p>
                  <p className="text-base font-black">{slot.time}</p>
                  <p className="text-[8px] font-black uppercase opacity-60">Arr: {slot.arr}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <button onClick={()=>setShowSeats(true)} className="px-8 py-4 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 active:scale-95 transition-all">
              <Zap size={14} className="text-amber-400"/> {data.selectedSeats.length > 0 ? `Seats: ${data.selectedSeats.join(', ')}` : 'Select Seat Map'}
            </button>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] space-y-8 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 ml-2"><Landmark size={20} className="text-primary-600"/><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">{t('hotelPref')}</h4></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Check-In</label>
              <input type="date" value={data.checkInDate} onChange={(e)=>setData({...data, checkInDate: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Check-Out</label>
              <input type="date" value={data.checkOutDate} onChange={(e)=>setData({...data, checkOutDate: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Rooms</label>
              <input type="number" min="1" value={data.rooms} onChange={(e)=>setData({...data, rooms: Math.max(1, parseInt(e.target.value))})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Room Type</label>
              <select value={data.roomType} onChange={(e)=>setData({...data, roomType: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none">
                <option value="standard">Standard</option><option value="deluxe">Deluxe</option>
                <option value="suite">Executive Suite</option><option value="presidential">Presidential</option>
              </select>
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-400 ml-4 uppercase">Price: ₹{hotelPrice.toLocaleString()} / Night</p>
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] space-y-8 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 ml-2"><Building2 size={20} className="text-primary-600"/><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white">CAB SELECTION</h4></div>
          <div className="grid grid-cols-4 gap-2">
            {['auto', 'sedan', 'suv', 'luxury'].map(id => {
              const cp = getDynamicPrice('cab', 900, data.destination, data.slot, id);
              return (
                <button key={id} onClick={()=>setData({...data, cabId: id})} className={`p-4 rounded-2xl flex flex-col items-center gap-1 transition-all ${data.cabId === id ? 'bg-primary-600 text-white shadow-xl scale-110' : 'bg-white dark:bg-slate-800 opacity-60'}`}>
                  <p className="text-[8px] font-black uppercase">{id}</p>
                  <p className="text-[9px] font-black">₹{cp}</p>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Pickup</label>
              <input value={data.pickup} onChange={(e)=>setData({...data, pickup: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" placeholder="Pickup location" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Dropoff</label>
              <input value={data.dropoff} onChange={(e)=>setData({...data, dropoff: e.target.value})} className="w-full p-5 bg-white dark:bg-slate-800 rounded-2xl font-bold border border-slate-100 dark:border-slate-700 outline-none" placeholder="Dropoff location" />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
          <div className="text-center"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Estimated Burn</p><p className="text-4xl font-black text-slate-900 dark:text-white">₹{total.toLocaleString()}</p></div>
          <button onClick={()=>onBook(total, data)} className="w-full py-9 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-[3rem] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">{t('pay')}</button>
        </div>
      </div>

      {showSeats && (
        <div className="fixed inset-0 z-[300] bg-slate-900/90 flex items-center justify-center p-8 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-sm space-y-8">
            <div className="flex justify-between items-center"><h4 className="text-2xl font-black uppercase tracking-tighter">Seat Mapping</h4><button onClick={()=>setShowSeats(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><XCircle size={24}/></button></div>
            <div className="grid grid-cols-6 gap-3 mx-auto max-w-[320px] p-6 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
              {Array.from({length: 30}).map((_, i) => {
                const seatId = `${Math.floor(i/6) + 1}${['A','B','C','D','E','F'][i%6]}`;
                const isSelected = data.selectedSeats.includes(seatId);
                const isAisle = i % 6 === 2 || i % 6 === 3;
                return (
                  <button key={seatId} onClick={()=>{
                    const next = isSelected ? data.selectedSeats.filter(s=>s!==seatId) : [...data.selectedSeats, seatId];
                    setData({...data, selectedSeats: next});
                  }} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-black transition-all ${isSelected ? 'bg-primary-600 text-white shadow-xl scale-110' : 'bg-white dark:bg-slate-700 opacity-60'} ${isAisle ? 'mx-1 border-x-2 border-slate-200/20' : ''}`}>
                    {seatId}
                  </button>
                );
              })}
            </div>
            <button onClick={()=>setShowSeats(false)} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest">Confirm {data.selectedSeats.length} Seats</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AIPlanner = ({ onClose, onComplete, t }: any) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    origin: '', destination: 'Assam', departureDate: '', returnDate: '', checkInDate: '', checkOutDate: '', budget: 50000, duration: 3, travelStyle: 'comfort', dietary: 'Vegetarian', preference: 'Window'
  });
  const steps = [
    { key: 'origin', q: t('origin'), icon: <MapPinned/> },
    { key: 'destination', q: 'Destination City', icon: <MapPin/> },
    { key: 'dates', q: `Travel Timeline`, icon: <Calendar/> },
    { key: 'budget', q: t('budgetLabel'), icon: <Wallet/> },
    { key: 'duration', q: 'Journey Duration (Days)', icon: <Clock/> },
    { key: 'style', q: t('hotelPref'), icon: <Landmark/> },
    { key: 'pref', q: 'Travel Preferences', icon: <Utensils/> },
    { key: 'confirm', q: 'Confirm Analysis', icon: <Sparkles/> }
  ];
  const next = () => step < steps.length ? setStep(step + 1) : onComplete(25965, data);

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col p-8 animate-in slide-in-from-bottom-full overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-12">
        <button onClick={step === 1 ? onClose : () => setStep(step - 1)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl"><ChevronLeft/></button>
        <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {step} of {steps.length}</p></div>
        <button onClick={onClose} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl"><XCircle/></button>
      </header>
      <div className="flex-1 flex flex-col space-y-10">
        <div className="flex items-center gap-4 text-primary-600">{steps[step-1].icon}<h2 className="text-3xl font-black tracking-tighter">{steps[step-1].q}</h2></div>
        <div className="flex-1">
          {step === 1 && <input placeholder="e.g., Mumbai Hub" className="w-full p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold outline-none" value={data.origin} onChange={e=>setData({...data, origin:e.target.value})}/>}
          {step === 2 && (
             <input 
                placeholder="Target City" 
                className="w-full p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold outline-none" 
                value={data.destination} 
                onChange={(e)=>setData({...data, destination: e.target.value})}
             />
          )}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">Departure Date</p>
              <input type="date" className="w-full p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold outline-none" value={data.departureDate} onChange={e=>setData({...data, departureDate:e.target.value})}/>
              <p className="text-[10px] font-black text-slate-400 ml-4 uppercase">Return Date (Optional)</p>
              <input type="date" className="w-full p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold outline-none" value={data.returnDate} onChange={e=>setData({...data, returnDate:e.target.value})}/>
            </div>
          )}
          {step === 4 && <input type="number" placeholder="₹ Value" className="w-full p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold text-center text-4xl outline-none" value={data.budget} onChange={e=>setData({...data, budget:parseInt(e.target.value)})}/>}
          {step === 5 && <div className="flex items-center justify-between p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem]"><button onClick={()=>setData({...data, duration:Math.max(1, data.duration-1)})} className="p-4 bg-white dark:bg-slate-800 rounded-xl"><Trash2/></button><span className="text-4xl font-black">{data.duration}</span><button onClick={()=>setData({...data, duration:data.duration+1})} className="p-4 bg-white dark:bg-slate-800 rounded-xl"><Plus/></button></div>}
          {step === 6 && <div className="grid grid-cols-3 gap-3">{['budget', 'comfort', 'luxury'].map(s=><button key={s} onClick={()=>setData({...data, travelStyle:s as any})} className={`p-6 rounded-3xl font-black uppercase text-[10px] ${data.travelStyle===s ? 'bg-primary-600 text-white':'bg-slate-50'}`}>{s}</button>)}</div>}
          {step === 7 && <div className="space-y-4"><div className="flex gap-4">{['Vegetarian', 'Non-Veg'].map(d=><button key={d} onClick={()=>setData({...data, dietary:d as any})} className={`flex-1 p-6 rounded-3xl font-black uppercase text-[10px] ${data.dietary===d ? 'bg-primary-600 text-white':'bg-slate-50'}`}>{d}</button>)}</div><div className="flex gap-4">{['Window', 'Aisle'].map(p=><button key={p} onClick={()=>setData({...data, preference:p as any})} className={`flex-1 p-6 rounded-3xl font-black uppercase text-[10px] ${data.preference===p ? 'bg-primary-600 text-white':'bg-slate-50'}`}>{p}</button>)}</div></div>}
          {step === 8 && <div className="p-8 bg-slate-900 text-white rounded-[3rem] text-center space-y-6"><Sparkles size={48} className="mx-auto text-primary-400"/><h4 className="text-2xl font-black">AI NODE READY</h4><p className="text-xs font-bold opacity-60">Optimized mapping for {data.destination} Hub confirmed.</p></div>}
        </div>
        <button onClick={next} className="w-full py-9 bg-primary-600 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">Next Protocol</button>
      </div>
    </div>
  );
};

const PaymentScreen = ({ amount, onCancel, onComplete, t }: any) => {
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<'upi' | 'card' | 'bank'>('upi');
  const [cardNo, setCardNo] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('01');
  const [expiryYear, setExpiryYear] = useState('2025');
  
  const handlePay = () => { setPaying(true); setTimeout(onComplete, 2000); };
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-[300] p-10 flex flex-col animate-in slide-in-from-bottom-full duration-500 overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-10"><button onClick={onCancel} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl"><XCircle/></button><h3 className="text-xl font-black uppercase tracking-tighter">{t('payment')}</h3><div className="w-12"/></header>
      
      <div className="p-12 bg-slate-900 text-white rounded-[4rem] text-center space-y-4 shadow-2xl relative overflow-hidden">
        <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.4em]">{t('payAmount')}</p>
        <p className="text-6xl font-black tracking-tighter">₹{amount.toLocaleString()}</p>
      </div>

      <div className="mt-12 space-y-10 flex-1">
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {['upi', 'card', 'bank'].map(m => (
            <button key={m} onClick={()=>setMethod(m as any)} className={`p-8 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-4 min-w-[140px] ${method === m ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-slate-100 opacity-40'}`}>
              {m === 'upi' ? <Smartphone size={28}/> : m === 'card' ? <CreditCard size={28}/> : <Banknote size={28}/>}
              <span className="text-[10px] font-black uppercase">{m === 'bank' ? 'Net Banking' : m}</span>
            </button>
          ))}
        </div>

        {method === 'upi' && (
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">UPI ID</label>
            <input placeholder="traveler@upi" className="w-full p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] font-bold outline-none border border-slate-100" />
          </div>
        )}

        {method === 'card' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Card Number</label>
              <input 
                placeholder="XXXX XXXX XXXX XXXX" 
                className="w-full p-8 bg-slate-50 rounded-[2rem] font-bold border-none outline-none focus:ring-2 ring-primary-500" 
                value={cardNo} 
                onChange={e=>setCardNo(e.target.value.replace(/\D/g, '').slice(0,16))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Expiry</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 p-5 bg-slate-50 rounded-2xl font-bold appearance-none border-none outline-none text-sm cursor-pointer hover:bg-slate-100 transition-colors"
                    value={expiryMonth}
                    onChange={(e)=>setExpiryMonth(e.target.value)}
                  >
                    {Array.from({length:12}).map((_,i)=><option key={i+1} value={(i+1).toString().padStart(2,'0')}>{(i+1).toString().padStart(2,'0')}</option>)}
                  </select>
                  <select 
                    className="flex-1 p-5 bg-slate-50 rounded-2xl font-bold appearance-none border-none outline-none text-sm cursor-pointer hover:bg-slate-100 transition-colors"
                    value={expiryYear}
                    onChange={(e)=>setExpiryYear(e.target.value)}
                  >
                    {Array.from({length:10}).map((_,i)=><option key={i+2025} value={(i+2025).toString()}>{(i+2025).toString()}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4">CVV</label>
                <input type="password" placeholder="XXX" maxLength={3} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none text-center" />
              </div>
            </div>
          </div>
        )}

        {method === 'bank' && (
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Select Bank</label>
            <select className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-bold appearance-none outline-none cursor-pointer">
              <option>SBI</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra</option>
            </select>
          </div>
        )}
      </div>

      <div className="pt-10 space-y-6">
        <button onClick={handlePay} disabled={paying} className="w-full py-9 bg-primary-600 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all">
          {paying ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'Authorize Sync'}
        </button>
      </div>
    </div>
  );
};

const AuthWrapper = ({ onLogin, t }: any) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [data, setData] = useState({ e: '', p: '', u: '' });
  const handleAction = () => {
    if (mode === 'register') {
      if (!data.e || !data.p || !data.u) return alert("Fill all fields");
      localStorage.setItem('registered_user', JSON.stringify(data));
      setMode('login');
      alert("Registration Successful!");
    } else {
      const saved = JSON.parse(localStorage.getItem('registered_user') || '{}');
      if ((data.e === saved.e && data.p === saved.p) || (data.e === 'test' && data.p === 'test')) onLogin({username: saved.u || 'Srinidhi'});
      else alert("Only registered nodes can gain access.");
    }
  };
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in overflow-hidden">
      <div className="relative w-full max-sm space-y-12 z-10 p-12 rounded-[4rem] bg-white shadow-2xl ring-1 ring-slate-100">
        <div className="space-y-4"><div className="w-24 h-24 bg-primary-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl transition-transform active:scale-95"><Plane size={48}/></div><h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">TravelEase</h1></div>
        <div className="space-y-4 text-left">
          {mode === 'register' && <input placeholder="Sync Name" className="w-full p-7 bg-white rounded-[2rem] font-bold outline-none ring-1 ring-slate-100 shadow-sm" value={data.u} onChange={e=>setData({...data, u:e.target.value})}/>}
          <input placeholder="Terminal ID" className="w-full p-7 bg-white rounded-[2rem] font-bold outline-none ring-1 ring-slate-100 shadow-sm" value={data.e} onChange={e=>setData({...data, e:e.target.value})}/>
          <input type="password" placeholder="Access Code" className="w-full p-7 bg-white rounded-[2rem] font-bold outline-none ring-1 ring-slate-100 shadow-sm" value={data.p} onChange={e=>setData({...data, p:e.target.value})}/>
          <button onClick={handleAction} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all mt-6">{mode === 'login' ? t('signIn') : t('signUp')}</button>
        </div>
        <button onClick={()=>setMode(mode==='login'?'register':'login')} className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{mode==='login'?'Register New Node':'Back to Terminal'}</button>
      </div>
    </div>
  );
};

const ChatBuddy = ({ activeBooking, lang, t, onCancel, onRebook }: any) => {
  const getGreeting = () => {
    if (lang === 'hi') return "नमस्ते! मैं आपका यात्रा मित्र हूँ। आपकी आज कैसे सहायता कर सकता हूँ?";
    if (lang === 'te') return "హలో! నేను మీ ప్రయాణ స్నేహితుడిని. ఈరోజు మీకు ఎలా సహాయపడగలను?";
    return "Hey! I'm Travel Buddy. How can I assist with your journey mapping today?";
  };
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', role: 'assistant', content: getGreeting(), timestamp: new Date(), type: 'default' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);
  
  const handleSend = async (customPrompt?: string) => {
    const prompt = customPrompt || input;
    if (!prompt.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: prompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);
    const context = activeBooking ? JSON.stringify([activeBooking]) : '[]';
    const response = await chatWithGemini(prompt, context, lang);
    setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: response.text, timestamp: new Date(), type: response.type }]);
    setLoading(false);
  };

  const handleChatCancel = () => {
    if (activeBooking) {
      onCancel(activeBooking.id);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "Operational directive received: Active Node terminated successfully.", 
        timestamp: new Date() 
      }]);
    }
  };
  
  return (
    <div className="flex flex-col h-[70vh] space-y-6">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-10">
        {messages.map(m => (
          <div key={m.id} className="space-y-4">
            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-7 rounded-[3rem] shadow-xl ${m.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-800'}`}>
                <p className="text-sm font-bold leading-relaxed">{m.content}</p>
              </div>
            </div>
            {m.type === 'action_rebook' && activeBooking && (
                <div className="flex gap-3 px-2 animate-in fade-in slide-in-from-bottom-2">
                    <button 
                        onClick={handleChatCancel}
                        className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-rose-100 shadow-sm active:scale-95 transition-all"
                    >
                        <Trash size={14} /> {t('cancel')}
                    </button>
                    <button 
                        onClick={() => onRebook(activeBooking)}
                        className="flex-1 py-4 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <Edit3 size={14} /> {t('rebook')}
                    </button>
                </div>
            )}
          </div>
        ))}
        {loading && <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] w-fit shadow-xl border border-slate-50"><Loader2 className="animate-spin text-primary-500" /></div>}
      </div>
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['Weather Prediction', 'Gate Changes', 'Budget & Expenses', 'Local Famous Places', 'Flight Cancellations & Rebooking'].map(q => (
            <button key={q} onClick={()=>handleSend(q)} className="shrink-0 px-6 py-3 bg-white/50 backdrop-blur-xl border border-white/50 rounded-full text-[9px] font-black uppercase tracking-widest text-primary-600 shadow-sm">{q}</button>
          ))}
        </div>
        <div className="flex gap-3 pb-4">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Sync with Buddy..." className="flex-1 p-7 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-none font-bold text-sm outline-none ring-1 ring-slate-100 dark:ring-slate-800" />
          <button onClick={()=>handleSend()} className="p-7 bg-primary-600 text-white rounded-[2.5rem] shadow-xl active:scale-90 transition-all"><Send size={24}/></button>
        </div>
      </div>
    </div>
  );
};

const TripsTab = ({ bookings, onCancel, onRebook, t }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right pb-10">
    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{t('upcoming')}</h2>
    {bookings.length === 0 ? <div className="p-20 text-center opacity-20"><Briefcase size={64} className="mx-auto"/><p className="font-black uppercase text-xs">No Active Nodes</p></div> : 
      <div className="space-y-6">
        {bookings.map((b: any) => (
          <div key={b.id} className={`p-10 rounded-[3.5rem] shadow-xl border space-y-6 transition-all ${b.status === 'cancelled' ? 'bg-slate-50 opacity-60 border-slate-200 grayscale' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white">{b.details?.origin} → {b.destination}</h4>
                <p className="text-[10px] font-black uppercase text-slate-400">{b.date}</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{b.mode} MODE • ID: {b.id}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : b.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                {b.status}
              </div>
            </div>

            <div className={`p-8 rounded-[2.5rem] flex justify-between items-center ${b.status === 'cancelled' ? 'bg-slate-200' : 'bg-slate-900 text-white'}`}>
              <div>
                <p className="text-[10px] font-black uppercase opacity-40">Value Transferred</p>
                <p className="text-3xl font-black">₹{b.spent.toLocaleString()}</p>
              </div>
              <Zap className={b.status === 'cancelled' ? 'text-slate-400' : 'text-amber-400'} size={32}/>
            </div>

            {b.status !== 'cancelled' && (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onCancel(b.id)}
                  className="py-5 bg-rose-50 text-rose-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
                >
                  <XCircle size={14} /> {t('cancel')}
                </button>
                <button 
                  onClick={() => onRebook(b)}
                  className="py-5 bg-primary-50 text-primary-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-primary-100 transition-all"
                >
                  <Edit3 size={14} /> {t('rebook')}
                </button>
              </div>
            )}
            
            {b.status === 'cancelled' && (
                <button 
                  onClick={() => onRebook(b)}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} className="text-amber-400" /> RESTORE NODE
                </button>
            )}
          </div>
        ))}
      </div>
    }
  </div>
);

const ProfileTab = ({ user, setUser, lang, setLang, theme, setTheme, t }: any) => (
  <div className="text-center pt-20 space-y-12 animate-in zoom-in-95">
    <div className="w-56 h-56 rounded-[5rem] border-[12px] border-white dark:border-slate-800 shadow-2xl mx-auto overflow-hidden bg-primary-50 flex items-center justify-center relative">
       <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/20 to-transparent" />
       <ProfileIcon size={64} className="text-primary-600 relative z-10" />
    </div>
    <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{user.username}</h2>
    <div className="flex justify-center gap-4">
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
        {theme === 'light' ? <Moon size={24}/> : <Sun size={24} className="text-amber-500"/>}
      </button>
    </div>
    <button onClick={()=>{setUser(null); localStorage.removeItem('travel_ease_user');}} className="w-full max-sm p-9 bg-rose-50 text-rose-600 rounded-[3rem] font-black uppercase tracking-[0.4em] flex items-center justify-between px-12 shadow-xl hover:bg-rose-100 transition-all"><span>Terminate Sync</span><LogOut/></button>
  </div>
);

export default MainApp;
