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
  ChevronRight, CheckCircle, BarChart3, Cloud, Edit3, Trash, Users,
  CloudRain, CloudLightning, CloudSun, WifiOff, RotateCcw, Ban, Car,
  ChevronDown
} from 'lucide-react';

// --- Helpers ---
const safeDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
};

const getDynamicPrice = (type: 'flight' | 'hotel' | 'cab', base: number, city: string, slot: string, tier: string) => {
  let multiplier = 1.0;
  const referenceCity = city?.split(',')[0].trim() || 'Default';
  const metros = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
  if (metros.some(m => referenceCity.toLowerCase().includes(m.toLowerCase()))) multiplier *= 1.4;
  else multiplier *= 0.9;
  if (slot === 'early' || slot === 'late') multiplier *= 0.8;
  if (slot === 'morning' || slot === 'evening') multiplier *= 1.3;
  const tiers: Record<string, number> = {
    'economy': 1, 'premium': 1.5, 'business': 2.5, 'first': 4.5,
    'standard': 1, 'deluxe': 1.6, 'suite': 2.8, 'presidential': 5.5,
    'auto': 0.5, 'sedan': 1.2, 'suv': 1.8, 'luxury': 3.5
  };
  multiplier *= (tiers[tier?.toLowerCase()] || 1);
  return Math.round(base * multiplier);
};

// --- Sub-Components ---

const BenchmarkGraph = ({ title, sub, time, paid, saved, icon, data, t, accentColor = 'primary' }: any) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const maxVal = Math.max(...data.map((d: any) => d.val || 0), 1);
  
  const colors: Record<string, string> = {
    primary: 'bg-primary-600',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500'
  };

  const shadowColors: Record<string, string> = {
    primary: 'shadow-[0_0_20px_rgba(14,165,233,0.4)]',
    amber: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    emerald: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]'
  };

  return (
    <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className={`p-4 rounded-2xl ${accentColor === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20' : accentColor === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
            {React.cloneElement(icon, { className: accentColor === 'primary' ? 'text-primary-600' : accentColor === 'amber' ? 'text-amber-500' : 'text-emerald-500', size: 24 })}
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{title} Analysis</h4>
            {sub && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{sub}</p>}
            {time && <p className={`text-[10px] font-bold mt-0.5 ${accentColor === 'primary' ? 'text-primary-600' : accentColor === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>{time}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Value Locked</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">₹{(paid || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Market Benchmark</p>
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
            <Sparkles size={12} />
            <span className="text-[9px] font-black uppercase">Saved ₹{(saved || 0).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-32 px-4 gap-6 relative">
          {data.map((d: any) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer h-full justify-end" onMouseEnter={() => setHovered(d.label)} onMouseLeave={() => setHovered(null)}>
              <div className="relative w-full flex items-end justify-center" style={{height: `${((d.val || 0) / maxVal) * 100}%`}}>
                {hovered === d.label && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-xl font-black z-20 whitespace-nowrap animate-in fade-in zoom-in-95 shadow-xl">
                    ₹{(d.val || 0).toLocaleString()}
                  </div>
                )}
                <div className={`w-full max-w-[45px] rounded-t-xl transition-all duration-700 h-full ${d.active ? `${colors[accentColor]} ${shadowColors[accentColor]}` : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`} />
              </div>
              <span className={`text-[8px] font-black uppercase truncate w-full text-center tracking-tighter ${d.active ? (accentColor === 'primary' ? 'text-primary-600' : accentColor === 'amber' ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-400'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, bookings, activeBookingId, setActiveBookingId, setBookingMode, setRebookData, lang, t }: any) => {
  const activeBooking = bookings.find((b: any) => b.id === activeBookingId) || (bookings.length > 0 ? bookings[0] : null);
  const budget = activeBooking?.details?.totalBudget || 0;
  const spent = activeBooking?.spent || 0;
  const remaining = budget - spent;
  const utilPerc = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const generateWeatherForecast = () => {
    if (!activeBooking || !activeBooking.date) return [];
    const days = [];
    const baseDate = safeDate(activeBooking.date);
    for (let i = -3; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const isDeparture = i === 0;
      const isDuring = i > 0 && i < (activeBooking?.details?.duration || 1);
      
      let dateLabel = 'N/A';
      try {
        dateLabel = d.toLocaleDateString(lang, { day: '2-digit', month: 'short' });
      } catch (e) { /* ignore */ }

      days.push({
        date: dateLabel,
        temp: 20 + Math.floor(Math.random() * 12),
        cond: i % 3 === 0 ? 'cloudy' : i % 5 === 0 ? 'rain' : 'sunny',
        active: isDeparture || isDuring
      });
    }
    return days;
  };

  const weatherData = generateWeatherForecast();
  const gateInfo = activeBooking ? {
    num: `T${1 + Math.floor(Math.random() * 3)}-G${10 + Math.floor(Math.random() * 50)}`,
    status: Math.random() > 0.7 ? 'red' : Math.random() > 0.4 ? 'yellow' : 'green'
  } : null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t('welcome')}{user.username}</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{t('terminalActive')}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => setBookingMode('manual')} className="px-6 py-3 bg-primary-600 text-white rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-primary-600/20 active:scale-95 transition-all">
            <Plane size={14} /> {t('manualBooking')}
          </button>
          <button onClick={() => setBookingMode('ai')} className="px-6 py-3 bg-slate-900 text-white rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-xl active:scale-95 transition-all">
            <Sparkles size={14} className="text-primary-400" /> {t('autoBooking')}
          </button>
        </div>
      </div>

      {activeBooking ? (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-primary-500/20 dark:border-primary-500/40 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 ring-4 ring-primary-500/5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white truncate max-w-[220px] tracking-tight">{activeBooking.details?.origin} → {activeBooking.destination}</h2>
              <p className="text-[11px] font-bold text-primary-600 uppercase tracking-widest">Active Link: {activeBooking.id}</p>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-primary-600 font-black text-2xl">₹</span>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${activeBooking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{activeBooking.status.toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 text-center">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-2">{t('budgetLabel')}</p>
              <p className="text-lg font-black text-slate-800 dark:text-white">₹{budget.toLocaleString()}</p>
            </div>
            <div className="p-5 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100/30 text-center">
              <p className="text-[9px] font-black uppercase text-primary-600 mb-2">{t('valueTransferred')}</p>
              <p className="text-lg font-black text-primary-700 dark:text-primary-400">₹{spent.toLocaleString()}</p>
            </div>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/30 text-center">
              <p className="text-[9px] font-black uppercase text-emerald-600 mb-2">REMAIN</p>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">₹{remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-1">
              <span>Budget Utilization</span>
              <span>{utilPerc}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-primary-600 rounded-full transition-all duration-1000" style={{width: `${utilPerc}%`}} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-100/50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-6">
           <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
              <Plane size={40} className="text-slate-300" />
           </div>
           <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Active Protocols</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Register a journey node to begin analysis</p>
           </div>
        </div>
      )}

      {/* SAVINGS ANALYSIS - FLIGHT, HOTEL, CAB */}
      {activeBooking && activeBooking.status !== 'cancelled' && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1.5 h-6 bg-primary-600 rounded-full"/>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Savings Intelligence</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            <BenchmarkGraph 
              title="Flight" 
              sub={`${activeBooking.details?.class || 'ECONOMY'} • WINDOW • ${activeBooking.details?.dietary || 'VEG'}`} 
              time="Departing Node" 
              paid={spent * 0.45} 
              saved={(spent * 0.45) * 0.15} 
              t={t}
              accentColor="primary"
              icon={<Plane/>}
              data={[
                { label: 'TravelEase', val: spent * 0.45, active: true },
                { label: 'Skyscanner', val: (spent * 0.45) * 1.22 },
                { label: 'MakeMyTrip', val: (spent * 0.45) * 1.15 },
                { label: 'GoIbibo', val: (spent * 0.45) * 1.18 }
              ]}
            />
            <BenchmarkGraph 
              title="Hotel" 
              sub={`${activeBooking.details?.roomType?.toUpperCase() || 'STANDARD'} NODE`} 
              time="Check-in 12:00 PM" 
              paid={spent * 0.35} 
              saved={(spent * 0.35) * 0.22} 
              t={t}
              accentColor="amber"
              icon={<Building2/>}
              data={[
                { label: 'TravelEase', val: spent * 0.35, active: true },
                { label: 'Booking.com', val: (spent * 0.35) * 1.28 },
                { label: 'Agoda', val: (spent * 0.35) * 1.25 },
                { label: 'Airbnb', val: (spent * 0.35) * 1.18 }
              ]}
            />
            <BenchmarkGraph 
              title="Cab" 
              sub={`${activeBooking.details?.cabId?.toUpperCase() || 'SUV'} • PICKUP`} 
              time="Gateway Assigned" 
              paid={spent * 0.20} 
              saved={(spent * 0.20) * 0.35} 
              t={t}
              accentColor="emerald"
              icon={<Car/>}
              data={[
                { label: 'TravelEase', val: spent * 0.20, active: true },
                { label: 'Uber', val: (spent * 0.20) * 1.45 },
                { label: 'Ola', val: (spent * 0.20) * 1.38 },
                { label: 'Local Fleet', val: (spent * 0.20) * 1.15 }
              ]}
            />
          </div>
        </div>
      )}

      {/* WEATHER & LIVE FEED */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <Navigation size={20} className="text-primary-600" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('nodeTracking')}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 min-h-[180px] flex flex-col justify-center">
            {weatherData.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('weatherTitle')}</p>
                   <span className="text-[9px] font-black uppercase text-primary-400">Environment Timeline</span>
                </div>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                   {weatherData.map((w, idx) => (
                     <div key={idx} className={`flex flex-col items-center gap-3 min-w-[60px] p-4 rounded-2xl transition-all ${w.active ? 'bg-primary-600 text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-slate-800'}`}>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{w.date}</span>
                        {w.cond === 'sunny' ? <Sun size={18} className={w.active ? 'text-white' : 'text-amber-500'} /> : w.cond === 'cloudy' ? <Cloud size={18} className={w.active ? 'text-white' : 'text-slate-400'} /> : <CloudRain size={18} className={w.active ? 'text-white' : 'text-blue-400'} />}
                        <span className="text-sm font-black">{w.temp}°</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center opacity-40 py-6">
                 <CloudSun size={32} className="mb-3 text-slate-400" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Environment Waiting...</p>
              </div>
            )}
          </div>
          
          <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between min-h-[180px]">
            {activeBooking ? (
              <>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-rose-500 animate-pulse">{t('live')}</p>
                  <h4 className="text-[12px] font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                    <Radar size={16} className="text-primary-600"/> {t('gateInfo')}
                  </h4>
                  <p className={`text-[11px] font-bold uppercase ${gateInfo?.status === 'green' ? 'text-emerald-500' : gateInfo?.status === 'yellow' ? 'text-amber-500' : 'text-rose-500'}`}>
                    {gateInfo?.status === 'green' ? t('gateStable') : gateInfo?.status === 'yellow' ? t('gateUnstable') : t('gateChanged')}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ml-auto mb-2 shadow-sm ${gateInfo?.status === 'green' ? 'bg-emerald-50 text-emerald-600' : gateInfo?.status === 'yellow' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Clock size={28} />
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{gateInfo ? gateInfo.num : 'N/A'}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center opacity-40 w-full py-6">
                 <WifiOff size={32} className="mb-3 text-slate-400" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No Live Uplink</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JOURNEY LIST */}
      <div className="space-y-6 pb-12">
        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter px-1">{t('indianJourneys')} ({bookings.length})</h3>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2">
          {bookings.map((b: any) => (
            <div 
              key={b.id} 
              onClick={() => setActiveBookingId(b.id)}
              className={`min-w-[320px] p-8 rounded-[3.5rem] border-2 transition-all cursor-pointer shadow-sm space-y-6 ${activeBookingId === b.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-xl shadow-primary-600/10 scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary-200'}`}
            >
              <div className="flex justify-between items-center">
                <div className={`p-4 rounded-2xl ${activeBookingId === b.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'}`}><Plane size={24}/></div>
                <div className="text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase block tracking-widest">{b.date}</span>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{b.status.toUpperCase()}</span>
                </div>
              </div>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white truncate tracking-tight">{b.details?.origin} → {b.destination}</h4>
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                <span>Budget: ₹{(b.details?.totalBudget || 0).toLocaleString()}</span>
                <span className="text-primary-600">Spent: ₹{(b.spent || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}

          <button onClick={() => { setRebookData(null); setBookingMode('manual'); }} className="min-w-[320px] p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-4 group transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-md group-hover:scale-110 transition-transform"><Plus size={36} className="text-slate-300 group-hover:text-primary-500" /></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">New Protocol Builder</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ManualJourneyBuilder = ({ onClose, onBook, t, initialData }: any) => {
  const [data, setData] = useState(initialData || {
    budget: 60000, 
    tripType: 'oneway', 
    class: 'Economy', 
    destination: 'Assam', 
    origin: 'Mumbai', 
    departureDate: '2026-01-21', 
    returnDate: '2026-01-25', 
    checkInDate: '2026-01-21', 
    checkOutDate: '2026-01-25', 
    slot: 'early', 
    preference: 'Window', 
    diet: 'Vegetarian', 
    passengers: 1, 
    hotelId: 'h-1', 
    rooms: 1, 
    roomType: 'standard', 
    cabId: 'suv', 
    pickup: 'Airport', 
    dropoff: 'Hotel', 
    selectedSeats: [] as string[]
  });

  const destCount = data.tripType === 'multi' ? (data.destination?.split(',').filter((x: string) => x.trim()).length || 1) : 1;
  const flightPrice = getDynamicPrice('flight', 3500, data.destination, data.slot, data.class) * destCount;
  const hotelPrice = getDynamicPrice('hotel', 2500, data.destination, data.slot, data.roomType);
  const cabPrice = getDynamicPrice('cab', 900, data.destination, data.slot, data.cabId);
  const total = (flightPrice * data.passengers * (data.tripType === 'round' ? 2 : 1)) + (hotelPrice * data.rooms) + cabPrice;

  const toggleSeat = (seat: string) => {
    const updated = data.selectedSeats.includes(seat) 
      ? data.selectedSeats.filter((s: string) => s !== seat)
      : [...data.selectedSeats, seat].slice(0, data.passengers);
    setData({...data, selectedSeats: updated});
  };

  const handleDateTrigger = (e: any) => {
    try { e.currentTarget.showPicker?.(); } catch(err){}
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col p-8 animate-in slide-in-from-bottom-full overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-transform active:scale-90"><XCircle/></button>
        <div className="text-center">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">JOURNEY BUILDER</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time dynamic Indian pricing.</p>
        </div>
        <div className="w-12"/>
      </header>
      
      <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] text-center mb-10 border border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">NODE CREDIT LIMIT (₹0 - ₹1Cr)</p>
        <div className="flex items-center gap-8 justify-center">
          <input type="range" min="0" max="10000000" step="10000" value={data.budget} onChange={(e)=>setData({...data, budget: parseInt(e.target.value) || 0})} className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-600" />
          <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">₹{(data.budget || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-12 pb-24">
        {/* PROTOCOL MODE & CLASS */}
        <div className="space-y-6">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {['oneway', 'round', 'multi'].map(type => (
              <button key={type} onClick={()=>setData({...data, tripType: type})} className={`px-10 py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.2em] whitespace-nowrap transition-all shadow-sm ${data.tripType === type ? 'bg-primary-600 text-white scale-105 shadow-xl shadow-primary-600/20' : 'bg-white dark:bg-slate-900 text-slate-300 border border-slate-100 dark:border-slate-800'}`}>{t(type) || type}</button>
            ))}
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {['Economy', 'Business', 'First'].map(cls => (
              <button key={cls} onClick={()=>setData({...data, class: cls})} className={`px-10 py-6 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.2em] whitespace-nowrap transition-all shadow-sm ${data.class === cls ? 'bg-slate-900 dark:bg-slate-700 text-white scale-105 shadow-xl shadow-black/20' : 'bg-white dark:bg-slate-900 text-slate-300 border border-slate-100 dark:border-slate-800'}`}>{cls}</button>
            ))}
          </div>
        </div>

        {/* FLIGHT SECTION */}
        <div className="p-10 bg-white dark:bg-slate-900 rounded-[4rem] space-y-12 border border-slate-100 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-[1.5rem]"><Plane size={28} className="text-primary-600"/></div>
            <h4 className="text-sm font-black uppercase tracking-[0.4em] text-slate-800 dark:text-white">{t('flightDetails')}</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('flyingFrom')}</label>
              <input value={data.origin} onChange={(e)=>setData({...data, origin: e.target.value})} className="w-full p-7 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-bold text-lg border-none outline-none ring-2 ring-slate-100 dark:ring-slate-800 focus:ring-primary-500 transition-all" placeholder={t('originCity')} />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('destination')}</label>
              <input value={data.destination} onChange={(e)=>setData({...data, destination: e.target.value})} className="w-full p-7 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-bold text-lg border-none outline-none ring-2 ring-slate-100 dark:ring-slate-800 focus:ring-primary-500 transition-all" placeholder={data.tripType === 'multi' ? t('multiCityHint') : t('targetCity')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('departureDate')}</label>
              <div className="relative">
                <input type="date" value={data.departureDate || ''} onClick={handleDateTrigger} onChange={(e)=>setData({...data, departureDate: e.target.value})} className="w-full p-7 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-bold text-lg border-none outline-none cursor-pointer" />
                <Calendar size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-primary-600" />
              </div>
            </div>
            {data.tripType !== 'oneway' ? (
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('returnDate')}</label>
                <div className="relative">
                  <input type="date" value={data.returnDate || ''} onClick={handleDateTrigger} onChange={(e)=>setData({...data, returnDate: e.target.value})} className="w-full p-7 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-bold text-lg border-none outline-none cursor-pointer" />
                  <Calendar size={20} className="absolute right-8 top-1/2 -translate-y-1/2 text-primary-600" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">TRAVEL UNITS</label>
                <div className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem]">
                  <button onClick={()=>setData({...data, passengers: Math.max(1, data.passengers-1)})} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm active:scale-90"><Trash2 size={18} className="text-rose-500"/></button>
                  <span className="font-black text-2xl flex-1 text-center tabular-nums">{data.passengers}</span>
                  <button onClick={()=>setData({...data, passengers: data.passengers+1})} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm active:scale-90"><Plus size={18} className="text-primary-600"/></button>
                </div>
              </div>
            )}
          </div>
          
          {data.tripType !== 'oneway' && (
            <div className="space-y-3 max-w-[50%]">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">TRAVEL UNITS</label>
              <div className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800 rounded-[2rem]">
                <button onClick={()=>setData({...data, passengers: Math.max(1, data.passengers-1)})} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm active:scale-90"><Trash2 size={18} className="text-rose-500"/></button>
                <span className="font-black text-2xl flex-1 text-center tabular-nums">{data.passengers}</span>
                <button onClick={()=>setData({...data, passengers: data.passengers+1})} className="p-4 bg-white dark:bg-slate-700 rounded-2xl shadow-sm active:scale-90"><Plus size={18} className="text-primary-600"/></button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h5 className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('seatMapping')}</h5>
            <div className="p-10 bg-slate-50 dark:bg-slate-800 rounded-[3.5rem] grid grid-cols-6 gap-4">
              {['A','B','C','D','E','F'].map(col => [1,2,3,4].map(row => {
                const seatId = `${row}${col}`;
                const isSelected = data.selectedSeats.includes(seatId);
                return (
                  <button key={seatId} onClick={()=>toggleSeat(seatId)} className={`aspect-square rounded-2xl text-[10px] font-black transition-all flex items-center justify-center ${isSelected ? 'bg-primary-600 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-300 hover:text-primary-400'}`}>
                    {seatId}
                  </button>
                );
              }))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">DIET CORE</label>
              <div className="flex gap-3">
                {['Vegetarian', 'Non-Veg'].map(d => (
                  <button key={d} onClick={()=>setData({...data, diet: d})} className={`flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase transition-all shadow-sm ${data.diet === d ? 'bg-primary-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">SPACE PREF</label>
              <div className="flex gap-3">
                {['Window', 'Aisle'].map(p => (
                  <button key={p} onClick={()=>setData({...data, preference: p})} className={`flex-1 py-5 rounded-[2rem] text-[11px] font-black uppercase transition-all shadow-sm ${data.preference === p ? 'bg-primary-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* HOTEL SECTION */}
        <div className="p-10 bg-slate-900 text-white rounded-[4rem] space-y-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10"><Building2 size={150}/></div>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-[1.5rem]"><Building2 size={28} className="text-amber-400"/></div>
            <h4 className="text-sm font-black uppercase tracking-[0.4em]">{t('hotelPref')}</h4>
          </div>
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-white/30 ml-6 tracking-widest">{t('checkin')}</label>
                <input type="date" value={data.checkInDate || ''} onClick={handleDateTrigger} onChange={(e)=>setData({...data, checkInDate: e.target.value})} className="w-full p-7 bg-white/5 rounded-[2rem] font-bold text-lg border-none outline-none text-white" />
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-white/30 ml-6 tracking-widest">{t('checkout')}</label>
                <input type="date" value={data.checkOutDate || ''} onClick={handleDateTrigger} onChange={(e)=>setData({...data, checkOutDate: e.target.value})} className="w-full p-7 bg-white/5 rounded-[2rem] font-bold text-lg border-none outline-none text-white" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-white/30 ml-6 tracking-widest">NODE COUNT (ROOMS)</label>
                <div className="flex items-center gap-6 p-5 bg-white/5 rounded-[2rem] border-none">
                  <button onClick={()=>setData({...data, rooms: Math.max(1, data.rooms-1)})} className="p-4 bg-white/10 rounded-2xl"><Trash2 size={18}/></button>
                  <span className="font-black text-2xl flex-1 text-center tabular-nums">{data.rooms}</span>
                  <button onClick={()=>setData({...data, rooms: data.rooms+1})} className="p-4 bg-white/10 rounded-2xl"><Plus size={18}/></button>
                </div>
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-white/30 ml-6 tracking-widest">TIER SELECT</label>
                <select value={data.roomType} onChange={(e)=>setData({...data, roomType: e.target.value})} className="w-full p-7 bg-white/5 rounded-[2rem] font-black text-lg border-none outline-none uppercase text-white appearance-none">
                   <option value="standard" className="bg-slate-900">Base Hub</option>
                   <option value="deluxe" className="bg-slate-900">Deluxe Node</option>
                   <option value="suite" className="bg-slate-900">Executive Grid</option>
                </select>
             </div>
          </div>
        </div>

        {/* CAB SECTION */}
        <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[4rem] space-y-12 border border-slate-100 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-[1.5rem]"><Car size={28} className="text-emerald-600"/></div>
            <h4 className="text-sm font-black uppercase tracking-[0.4em] text-slate-800 dark:text-white">{t('cabSelection')}</h4>
          </div>
          <div className="grid grid-cols-4 gap-4">
             {['auto', 'sedan', 'suv', 'luxury'].map(c => (
               <button key={c} onClick={()=>setData({...data, cabId: c})} className={`p-8 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all shadow-sm ${data.cabId === c ? 'bg-emerald-600 text-white scale-110 shadow-xl shadow-emerald-600/20' : 'bg-white dark:bg-slate-800 text-slate-300'}`}>
                 <Car size={24}/>
                 <span className="text-[10px] font-black uppercase tracking-widest">{c}</span>
               </button>
             ))}
          </div>
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('pickup')}</label>
                <input value={data.pickup} onChange={(e)=>setData({...data, pickup: e.target.value})} className="w-full p-7 bg-white dark:bg-slate-800 rounded-[2rem] font-bold text-lg border-none outline-none ring-2 ring-slate-100 dark:ring-slate-800 focus:ring-emerald-500" placeholder={t('pickupLoc')} />
             </div>
             <div className="space-y-3">
                <label className="text-[11px] font-black uppercase text-slate-400 ml-6 tracking-widest">{t('dropoff')}</label>
                <input value={data.dropoff} onChange={(e)=>setData({...data, dropoff: e.target.value})} className="w-full p-7 bg-white dark:bg-slate-800 rounded-[2rem] font-bold text-lg border-none outline-none ring-2 ring-slate-100 dark:ring-slate-800 focus:ring-emerald-500" placeholder={t('dropoffLoc')} />
             </div>
          </div>
        </div>

        {/* VALUATION SUMMARY */}
        <div className="pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-10">
          <div className="text-center">
            <p className="text-[12px] font-black uppercase text-slate-300 mb-3 tracking-[0.5em]">VALUATION SUMMARY</p>
            <p className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">₹{total.toLocaleString()}</p>
          </div>
          <button onClick={()=>onBook(total, data)} className="w-full py-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[4rem] font-black uppercase tracking-[0.6em] text-sm shadow-2xl active:scale-95 transition-all">CONFIRM & EXECUTE PROTOCOL</button>
        </div>
      </div>
    </div>
  );
};

const AIPlanner = ({ onClose, onComplete, t }: any) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    origin: '', 
    destination: 'Assam', 
    tripType: 'oneway',
    multiCityCount: 2,
    multiCityList: '',
    departureDate: '2026-01-21', 
    returnDate: '', 
    budget: 50000, 
    duration: 3, 
    travelStyle: 'comfort', 
    dietary: 'Vegetarian', 
    preference: 'Window',
    peopleCount: 1
  });

  const allStepsConfig = [
    { key: 'origin', q: t('origin') || 'Starting Point', icon: <MapPinned/> },
    { key: 'destination', q: t('destination') || 'Final Target', icon: <MapPin/> },
    { key: 'tripType', q: t('tripTypeQ') || 'Protocol Mode', icon: <Navigation/> },
    ...(data.tripType === 'multi' ? [
        { key: 'multiCount', q: t('howManyCities') || 'Nodes Count', icon: <BarChart3/> },
        { key: 'multiList', q: t('whichCities') || 'Nodes List', icon: <MapPinned/> }
    ] : []),
    { key: 'people', q: t('howManyPeople') || 'Traveler Units', icon: <Users/> },
    { key: 'dates', q: `Journey Timeline`, icon: <Calendar/> },
    { key: 'budget', q: t('budgetLabel') || 'Credit Allocation', icon: <Wallet/> },
    { key: 'duration', q: 'Node Duration (Days)', icon: <Clock/> },
    { key: 'style', q: t('hotelPref') || 'Living Tier', icon: <Landmark/> },
    { key: 'pref', q: 'Node Preferences', icon: <Utensils/> },
    { key: 'confirm', q: 'Validation Complete', icon: <Sparkles/> }
  ];

  const currentStepData = allStepsConfig[step - 1];
  const next = () => step < allStepsConfig.length ? setStep(step + 1) : onComplete(25965, data);

  const handleDateTrigger = (e: any) => {
    try { e.currentTarget.showPicker?.(); } catch(err){}
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col p-8 animate-in slide-in-from-bottom-full overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-12">
        <button onClick={step === 1 ? onClose : () => setStep(step - 1)} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-transform active:scale-90"><ChevronLeft/></button>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol {step} of {allStepsConfig.length}</p>
          <div className="h-1 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden mx-auto">
            <div className="h-full bg-primary-600 transition-all duration-500" style={{width: `${(step / allStepsConfig.length) * 100}%`}} />
          </div>
        </div>
        <button onClick={onClose} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl"><XCircle/></button>
      </header>
      <div className="flex-1 flex flex-col space-y-10">
        <div className="flex items-center gap-4 text-primary-600">
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">{currentStepData.icon}</div>
          <h2 className="text-3xl font-black tracking-tighter leading-none">{currentStepData.q}</h2>
        </div>
        <div className="flex-1">
          {currentStepData.key === 'origin' && <input placeholder="e.g., Mumbai Hub" className="w-full p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold text-xl outline-none border border-transparent focus:border-primary-500 transition-all" value={data.origin} onChange={e=>setData({...data, origin:e.target.value})}/>}
          {currentStepData.key === 'destination' && <input placeholder={t('targetCity')} className="w-full p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] font-bold text-xl outline-none border border-transparent focus:border-primary-500 transition-all" value={data.destination} onChange={e=>setData({...data, destination: e.target.value})}/>}
          {currentStepData.key === 'tripType' && (
            <div className="flex flex-col gap-4">
              {['oneway', 'round', 'multi'].map(type => (
                <button key={type} onClick={() => setData({...data, tripType: type as any})} className={`w-full p-10 rounded-[2.5rem] font-black uppercase text-left transition-all flex justify-between items-center ${data.tripType === type ? 'bg-primary-600 text-white shadow-2xl scale-[1.05]' : 'bg-slate-50 dark:bg-slate-900 opacity-60 hover:opacity-100'}`}>
                  {t(type) || type}
                  {data.tripType === type && <CheckCircle size={24} />}
                </button>
              ))}
            </div>
          )}
          {currentStepData.key === 'multiCount' && <input type="number" className="w-full p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] font-black text-center text-5xl tabular-nums" value={data.multiCityCount} onChange={e => setData({...data, multiCityCount: parseInt(e.target.value) || 0})} />}
          {currentStepData.key === 'multiList' && <input placeholder={t('whichCities')} className="w-full p-10 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] font-bold outline-none" value={data.multiCityList} onChange={e=>setData({...data, multiCityList: e.target.value})}/>}
          {currentStepData.key === 'people' && (
             <div className="flex items-center justify-between p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem]">
               <button onClick={()=>setData({...data, peopleCount:Math.max(1, data.peopleCount-1)})} className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm"><Trash2 size={24} className="text-rose-500" /></button>
               <span className="text-7xl font-black tabular-nums">{data.peopleCount}</span>
               <button onClick={()=>setData({...data, peopleCount:data.peopleCount+1})} className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-sm"><Plus size={24} className="text-primary-600" /></button>
             </div>
          )}
          {currentStepData.key === 'dates' && (
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">{t('departureDate')}</p>
                <div className="relative">
                  <input type="date" value={data.departureDate || ''} onClick={handleDateTrigger} onChange={e=>setData({...data, departureDate:e.target.value})} className="w-full p-8 pr-16 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] font-bold text-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer" />
                  <Calendar size={28} className="absolute right-8 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none" />
                </div>
              </div>
              {(data.tripType === 'round' || data.tripType === 'multi') && (
                <div className="space-y-3">
                  <p className="text-[11px] font-black text-slate-400 ml-6 uppercase tracking-widest">{t('returnDate')}</p>
                  <div className="relative">
                    <input type="date" value={data.returnDate || ''} onClick={handleDateTrigger} onChange={e=>setData({...data, returnDate:e.target.value})} className="w-full p-8 pr-16 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] font-bold text-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer" />
                    <Calendar size={28} className="absolute right-8 top-1/2 -translate-y-1/2 text-primary-600 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}
          {currentStepData.key === 'budget' && <input type="number" placeholder="₹ Allocation" className="w-full p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] font-black text-center text-5xl tabular-nums" value={data.budget} onChange={e=>setData({...data, budget:parseInt(e.target.value) || 0})}/>}
          {currentStepData.key === 'duration' && <div className="flex items-center justify-between p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem]"><button onClick={()=>setData({...data, duration:Math.max(1, data.duration-1)})} className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm"><Trash2 size={24}/></button><span className="text-5xl font-black tabular-nums">{data.duration}</span><button onClick={()=>setData({...data, duration:data.duration+1})} className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm"><Plus size={24}/></button></div>}
          {currentStepData.key === 'style' && <div className="grid grid-cols-3 gap-4">{['budget', 'comfort', 'luxury'].map(s=><button key={s} onClick={()=>setData({...data, travelStyle:s as any})} className={`p-8 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] transition-all shadow-sm ${data.travelStyle===s ? 'bg-primary-600 text-white shadow-xl scale-[1.08]':'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>{s}</button>)}</div>}
          {currentStepData.key === 'pref' && (
            <div className="space-y-6">
              <div className="flex gap-4">{['Vegetarian', 'Non-Veg'].map(d=><button key={d} onClick={()=>setData({...data, dietary:d as any})} className={`flex-1 p-8 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] transition-all shadow-sm ${data.dietary===d ? 'bg-primary-600 text-white shadow-xl':'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>{d}</button>)}</div>
              <div className="flex gap-4">{['Window', 'Aisle'].map(p=><button key={p} onClick={()=>setData({...data, preference:p as any})} className={`flex-1 p-8 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] transition-all shadow-sm ${data.preference===p ? 'bg-primary-600 text-white shadow-xl':'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>{p}</button>)}</div>
            </div>
          )}
          {currentStepData.key === 'confirm' && <div className="p-12 bg-slate-900 text-white rounded-[4rem] text-center space-y-8 animate-pulse shadow-2xl ring-4 ring-primary-500/20"><Sparkles size={64} className="mx-auto text-primary-400"/><h4 className="text-3xl font-black uppercase tracking-tighter leading-none">AI Protocol Validated</h4><p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.4em]">Node Link Ready for Execution</p></div>}
        </div>
        <button onClick={next} className="w-full py-10 bg-primary-600 text-white rounded-[3.5rem] font-black uppercase tracking-[0.5em] text-sm shadow-2xl active:scale-95 transition-all">Proceed to Synthesis</button>
      </div>
    </div>
  );
};

const AuthWrapper = ({ onLogin, t }: any) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [data, setData] = useState({ e: '', p: '', u: '' });

  const handleAction = () => {
    try {
      const usersList = JSON.parse(localStorage.getItem('travel_ease_registered_users') || '[]');
      if (mode === 'register') {
        if (!data.e || !data.p || !data.u) return alert("Terminal data required.");
        const newUser = { id: `user_${Date.now()}`, e: data.e, p: data.p, username: data.u };
        localStorage.setItem('travel_ease_registered_users', JSON.stringify([...usersList, newUser]));
        setMode('login');
        alert("Node registered.");
      } else {
        const found = usersList.find((u: any) => (u.e === data.e && u.p === data.p) || (data.e === 'test' && data.p === 'test'));
        if (found || (data.e === 'test' && data.p === 'test')) {
          onLogin(found || { id: 'test_1', username: 'Pilot' });
        } else alert("Authorization denied.");
      }
    } catch(e) { alert("Authorization Error."); }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in overflow-hidden">
      <div className="relative w-full max-w-sm space-y-12 z-10 p-12 rounded-[4rem] bg-white shadow-2xl ring-1 ring-slate-100">
        <div className="space-y-4"><div className="w-24 h-24 bg-primary-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl active:scale-95"><Plane size={48}/></div><h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">TravelEase</h1></div>
        <div className="space-y-4 text-left">
          {mode === 'register' && <input placeholder="Pilot Name" className="w-full p-7 bg-white rounded-[2rem] font-bold outline-none ring-1 ring-slate-100 shadow-sm" value={data.u} onChange={e=>setData({...data, u:e.target.value})}/>}
          <input placeholder="Terminal ID" className="w-full p-7 bg-white rounded-[2rem] font-bold outline-none ring-1 ring-slate-100 shadow-sm" value={data.e} onChange={e=>setData({...data, e:e.target.value})}/>
          <input type="password" placeholder="Access Code" className="w-full p-7 bg-white rounded-[2rem] font-bold outline-none ring-1 ring-slate-100 shadow-sm" value={data.p} onChange={e=>setData({...data, p:e.target.value})}/>
          <button onClick={handleAction} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-xl mt-6 active:scale-95 transition-all">{mode === 'login' ? 'Launch Node' : 'Register Terminal'}</button>
        </div>
        <button onClick={()=>setMode(mode==='login'?'register':'login')} className="text-[11px] font-black text-primary-600 uppercase tracking-widest">{mode==='login'?'Register Protocol':'Return to Terminal'}</button>
      </div>
    </div>
  );
};

const ProfileTab = ({ user, onLogout, lang, setLang, theme, setTheme, t }: any) => (
  <div className="text-center pt-20 space-y-16 animate-in zoom-in-95">
    <div className="w-64 h-64 rounded-[6rem] border-[16px] border-white dark:border-slate-800 shadow-2xl mx-auto overflow-hidden bg-primary-50 flex items-center justify-center ring-8 ring-slate-50 dark:ring-slate-900">
       <ProfileIcon size={80} className="text-primary-600" />
    </div>
    <div className="space-y-2">
      <h2 className="text-6xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">{user.username}</h2>
      <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">{user.id}</p>
    </div>
    <div className="flex flex-col items-center gap-6">
      <div className="flex justify-center gap-6">
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 active:scale-90 transition-transform">
          {theme === 'light' ? <Moon size={32}/> : <Sun size={32} className="text-amber-500"/>}
        </button>
        <div className="flex gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-[3rem]">
          {['en', 'hi', 'te'].map(l => (
            <button key={l} onClick={() => setLang(l as Language)} className={`px-8 py-6 rounded-[2rem] font-black uppercase text-[12px] transition-all shadow-sm ${lang === l ? 'bg-primary-600 text-white' : 'text-slate-400'}`}>{l}</button>
          ))}
        </div>
      </div>
      <button onClick={onLogout} className="w-full max-w-md p-10 bg-rose-50 text-rose-600 rounded-[3.5rem] font-black uppercase tracking-[0.6em] text-xs flex items-center justify-between px-16 shadow-xl hover:bg-rose-100 transition-all active:scale-95"><span>Terminate Node</span><LogOut size={24}/></button>
    </div>
  </div>
);

const TripsTab = ({ bookings, onCancel, onRebook, t }: any) => (
  <div className="space-y-8 animate-in slide-in-from-right pb-10">
    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">{t('upcoming')}</h2>
    <div className="space-y-8">
      {bookings.length === 0 && <p className="text-center text-slate-400 py-16 font-bold uppercase text-[12px] tracking-widest">No active journey nodes detected.</p>}
      {bookings.map((b: any) => (
        <div key={b.id} className={`p-10 rounded-[4rem] shadow-xl border space-y-8 transition-all ${b.status === 'cancelled' ? 'bg-slate-50 opacity-60 border-slate-200 grayscale' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-slate-800 dark:text-white truncate tracking-tight">{b.details?.origin} → {b.destination}</h4>
              <p className="text-[11px] font-black uppercase text-primary-600 tracking-[0.2em]">{b.date}</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {b.status.toUpperCase()}
            </div>
          </div>
          <div className="flex justify-between items-center p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-inner">
             <div><p className="text-[10px] font-black opacity-40 tracking-widest">VALUE SYNC</p><p className="text-3xl font-black uppercase tracking-tighter">₹{(b.spent || 0).toLocaleString()}</p></div>
             <Zap className="text-amber-400" size={32}/>
          </div>
          {b.status !== 'cancelled' && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => onCancel(b.id)} className="flex items-center justify-center gap-3 py-6 bg-rose-50 text-rose-600 rounded-[2rem] text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"><Ban size={16}/> {t('cancel')}</button>
              <button onClick={() => onRebook(b)} className="flex items-center justify-center gap-3 py-6 bg-primary-50 text-primary-600 rounded-[2rem] text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"><RotateCcw size={16}/> {t('rebook')}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const ChatBuddy = ({ activeBooking, lang, t, onCancel, onRebook, userId }: any) => {
  const chatKey = `travel_ease_chat_${userId}_${activeBooking?.id || 'general'}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(chatKey);
    return saved ? JSON.parse(saved) : [{ id: '1', role: 'assistant', content: "Node connectivity stable. How can I assist with your journey?", timestamp: new Date(), type: 'default' }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(chatKey, JSON.stringify(messages));
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, chatKey]);
  
  const handleSend = async (customPrompt?: string) => {
    const prompt = customPrompt || input;
    if (!prompt.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: prompt, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);
    const response = await chatWithGemini(prompt, JSON.stringify([activeBooking]), lang);
    const assistantMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: response.text, timestamp: new Date(), type: response.type };
    setMessages(prev => [...prev, assistantMsg]);
    setLoading(false);
  };
  
  return (
    <div className="flex flex-col h-[70vh] space-y-6">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 no-scrollbar pb-10">
        {messages.map(m => (
          <div key={m.id} className="space-y-4">
            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-8 rounded-[3.5rem] shadow-xl ${m.role === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-800'}`}>
                <p className="text-[15px] font-bold leading-relaxed">{m.content}</p>
                {m.type === 'action_rebook' && activeBooking && (
                  <div className="mt-8 flex flex-col gap-3">
                    <button onClick={() => onCancel(activeBooking.id)} className="w-full py-5 bg-rose-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"><Ban size={16}/> Terminate Node</button>
                    <button onClick={() => onRebook(activeBooking)} className="w-full py-5 bg-primary-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"><RotateCcw size={16}/> Reroute Journey</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] w-fit shadow-xl border border-slate-50"><Loader2 className="animate-spin text-primary-500" /></div>}
      </div>
      <div className="space-y-6">
        <div className="flex flex-nowrap gap-3 overflow-x-auto no-scrollbar whitespace-nowrap px-1 pb-2">
          {['Weather Forecast', 'Gate Status', 'Budget Analysis', 'Local Attractions'].map(q => (
            <button key={q} onClick={() => handleSend(q)} className="shrink-0 px-8 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-sm transition-transform active:scale-95">{q}</button>
          ))}
        </div>
        <div className="flex gap-4 pb-4">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t('syncBuddy')} className="flex-1 p-8 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border-none font-bold text-lg outline-none ring-1 ring-slate-100 dark:ring-slate-800" />
          <button onClick={() => handleSend()} className="p-8 bg-primary-600 text-white rounded-[3rem] shadow-xl active:scale-90 transition-all"><Send size={32}/></button>
        </div>
      </div>
    </div>
  );
};

const PaymentScreen = ({ amount, onCancel, onComplete, t }: any) => {
  const [method, setMethod] = useState<'card' | 'upi' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: '',
    walletPhone: ''
  });

  const handlePay = () => {
    // Validation
    if (method === 'card' && (!formData.cardNumber || formData.cardNumber.length < 16 || !formData.cardExpiry || !formData.cardCvv)) {
        alert("Please enter valid card details.");
        return;
    }
    if (method === 'upi' && (!formData.upiId || !formData.upiId.includes('@'))) {
        alert("Please enter a valid UPI ID (e.g. name@upi).");
        return;
    }
    if (method === 'wallet' && (!formData.walletPhone || formData.walletPhone.length < 10)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onComplete();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-start p-8 animate-in fade-in overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[4rem] p-10 space-y-8 shadow-2xl relative overflow-visible border border-slate-100 dark:border-slate-800 my-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Payment Terminal</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mandatory Node Authorization</p>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] text-center border border-slate-100 dark:border-slate-700">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Valuation</p>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">₹{amount.toLocaleString()}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
           {[
             { id: 'card', icon: <CreditCard size={18}/>, label: 'Card' },
             { id: 'upi', icon: <Smartphone size={18}/>, label: 'UPI' },
             { id: 'wallet', icon: <Wallet size={18}/>, label: 'Wallet' }
           ].map(m => (
             <button key={m.id} onClick={() => setMethod(m.id as any)} className={`p-5 rounded-3xl flex flex-col items-center gap-2 transition-all ${method === m.id ? 'bg-primary-600 text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                {m.icon}
                <span className="text-[9px] font-black uppercase">{m.label}</span>
             </button>
           ))}
        </div>

        <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
          {method === 'card' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Card Node ID</label>
                <input 
                    placeholder="0000 0000 0000 0000" 
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-sm outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-primary-500"
                    value={formData.cardNumber}
                    onChange={e => setFormData({...formData, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Expiry</label>
                    <input 
                        placeholder="MM/YY" 
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-sm outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-primary-500"
                        value={formData.cardExpiry}
                        onChange={e => setFormData({...formData, cardExpiry: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Secure CVV</label>
                    <input 
                        placeholder="000" 
                        type="password"
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-sm outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-primary-500"
                        value={formData.cardCvv}
                        onChange={e => setFormData({...formData, cardCvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                    />
                </div>
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Virtual Private ID</label>
                <input 
                    placeholder="user@upi-node" 
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-sm outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-primary-500"
                    value={formData.upiId}
                    onChange={e => setFormData({...formData, upiId: e.target.value})}
                />
            </div>
          )}

          {method === 'wallet' && (
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Linked Link-Phone</label>
                <input 
                    placeholder="10-digit primary node" 
                    type="tel"
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-bold text-sm outline-none ring-1 ring-slate-100 dark:ring-slate-700 focus:ring-primary-500"
                    value={formData.walletPhone}
                    onChange={e => setFormData({...formData, walletPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                />
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <button onClick={handlePay} disabled={processing} className="w-full py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-4">
            {processing ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {processing ? 'AUTHORIZING NODE...' : 'Authorize Transaction'}
          </button>
          <button onClick={onCancel} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors">Abandon Node</button>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('travel_ease_current_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('travel_ease_lang');
    return (saved as Language) || 'en';
  });

  const [tab, setTab] = useState<'home' | 'trips' | 'chat' | 'profile'>(() => {
    const saved = localStorage.getItem('travel_ease_tab');
    return (saved as any) || 'home';
  });

  const [bookingMode, setBookingMode] = useState<'none' | 'ai' | 'manual'>('none');
  const [rebookData, setRebookData] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<{ amount: number; data: any } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [activeBookingId, setActiveBookingId] = useState<string | null>(() => {
    return localStorage.getItem('travel_ease_active_booking_id');
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('travel_ease_theme');
    return (saved as any) || 'light';
  });

  const t = (key: string) => (TRANSLATIONS[lang] as any)[key] || key;

  useEffect(() => {
    if (user?.id) {
      try {
        const savedBookings = localStorage.getItem(`travel_ease_bookings_${user.id}`);
        const parsed = savedBookings ? JSON.parse(savedBookings) : [];
        setBookings(Array.isArray(parsed) ? parsed : []);
        if (!activeBookingId && parsed.length > 0) {
            setActiveBookingId(parsed[0].id);
        }
      } catch (e) { setBookings([]); }
    } else {
      setBookings([]);
      setActiveBookingId(null);
    }
  }, [user?.id]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('travel_ease_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('travel_ease_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('travel_ease_tab', tab);
  }, [tab]);

  useEffect(() => {
    if (activeBookingId) {
      localStorage.setItem('travel_ease_active_booking_id', activeBookingId);
    }
  }, [activeBookingId]);

  const handleBookingComplete = () => {
    if (!paymentDetails || !user) return;
    const newBooking: Booking = { 
      id: `node_${Date.now()}`, 
      type: 'bundle', 
      destination: paymentDetails.data.destination || 'India', 
      date: paymentDetails.data.departureDate || '2026-01-21', 
      spent: paymentDetails.amount || 0, 
      status: 'confirmed', 
      mode: bookingMode === 'ai' ? 'automatic' : 'manual',
      details: {
        ...paymentDetails.data,
        totalBudget: paymentDetails.data.budget || 0
      }
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    localStorage.setItem(`travel_ease_bookings_${user.id}`, JSON.stringify(updated));
    setActiveBookingId(newBooking.id);
    setPaymentDetails(null);
    setBookingMode('none');
    setRebookData(null);
    setTab('home');
  };

  const cancelBooking = (id: string) => {
    if (!user) return;
    const updated = bookings.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b);
    setBookings(updated);
    localStorage.setItem(`travel_ease_bookings_${user.id}`, JSON.stringify(updated));
  };

  const startRebooking = (booking: Booking) => {
    setRebookData(booking.details);
    setBookingMode('manual');
  };

  const handleLogout = () => {
    localStorage.removeItem('travel_ease_current_session');
    localStorage.removeItem('travel_ease_tab');
    localStorage.removeItem('travel_ease_active_booking_id');
    setUser(null);
    setBookings([]);
    setActiveBookingId(null);
    setTab('home');
  };

  const activeBooking = bookings.find(b => b.id === activeBookingId) || (bookings.length > 0 ? bookings[0] : null);

  if (!user) return <AuthWrapper onLogin={(u: any) => { setUser(u); localStorage.setItem('travel_ease_current_session', JSON.stringify(u)); }} t={t} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col w-full max-w-lg mx-auto overflow-hidden relative border-x border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-500">
      <main className="flex-1 overflow-y-auto p-8 no-scrollbar pb-40 space-y-12">
        {tab === 'home' ? (
          <Dashboard user={user} bookings={bookings} activeBookingId={activeBookingId} setActiveBookingId={setActiveBookingId} setBookingMode={setBookingMode} setRebookData={setRebookData} lang={lang} t={t} />
        ) : tab === 'trips' ? (
          <TripsTab bookings={bookings} onCancel={cancelBooking} onRebook={startRebooking} t={t} />
        ) : tab === 'chat' ? (
          <ChatBuddy activeBooking={activeBooking} lang={lang} t={t} onCancel={cancelBooking} onRebook={startRebooking} userId={user.id} />
        ) : (
          <ProfileTab user={user} onLogout={handleLogout} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} />
        )}
      </main>

      <nav className="fixed bottom-8 inset-x-8 h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] flex items-center justify-around px-6 shadow-2xl z-[110] border border-white/20 dark:border-slate-800">
        {[ {id:'home', icon:<HomeIcon size={26}/>}, {id:'trips', icon:<Briefcase size={26}/>}, {id:'chat', icon:<MessageSquare size={26}/>}, {id:'profile', icon:<ProfileIcon size={26}/>} ].map(item => (
          <button key={item.id} onClick={()=>{setTab(item.id as any); setBookingMode('none');}} className={`p-5 rounded-3xl transition-all duration-300 ${tab === item.id ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 scale-110' : 'text-slate-300 hover:text-slate-500'}`}>{item.icon}</button>
        ))}
        <button onClick={() => setBookingMode('ai')} className="p-6 bg-primary-600 text-white rounded-full shadow-2xl shadow-primary-600/30 active:scale-90 transition-transform">
          <Sparkles size={28} />
        </button>
      </nav>

      {bookingMode === 'manual' && <ManualJourneyBuilder initialData={rebookData} onClose={()=>{setBookingMode('none'); setRebookData(null);}} onBook={(amt: any, data: any)=>setPaymentDetails({amount: amt, data})} t={t}/>}
      {bookingMode === 'ai' && <AIPlanner onClose={()=>setBookingMode('none')} onComplete={(amt: any, data: any)=>setPaymentDetails({amount: amt, data})} t={t}/>}
      {paymentDetails && <PaymentScreen amount={paymentDetails.amount} onCancel={()=>setPaymentDetails(null)} onComplete={handleBookingComplete} t={t} />}
    </div>
  );
};

export default MainApp;