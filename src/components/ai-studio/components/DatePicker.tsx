import React, { useState, useEffect, useRef } from 'react';

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, error, placeholder = 'dd/mm/aaaa' }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Parse value YYYY-MM-DD to Date
  const parseDate = (val: string) => {
    if (!val) return null;
    const [y, m, d] = val.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  useEffect(() => {
    const d = parseDate(value);
    if (d) setCurrentDate(d);
  }, [showCalendar, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const fullDate = `${currentDate.getFullYear()}-${month}-${dayStr}`;
    onChange(fullDate);
    setShowCalendar(false);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const isSelected = value === dateStr;
    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), i).toDateString();

    days.push(
      <button
        key={i}
        onClick={(e) => handleDayClick(i, e)}
        className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200
          ${isSelected ? 'bg-black text-white shadow-lg' :
            isToday ? 'bg-gray-200 text-black' : 'text-gray-700 hover:bg-gray-100'}
        `}
      >
        {i}
      </button>
    );
  }

  const formattedValue = value ? value.split('-').reverse().join('/') : '';

  return (
    <div className="relative" ref={wrapperRef}>
      <label className={`text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1 ml-1 block ${error ? 'text-red-600' : ''}`}>{label}</label>
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        className={`w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-2 h-[34px] cursor-pointer hover:border-gray-400 transition-all ${error ? 'bg-red-50 border-red-300 text-red-600' : ''} ${showCalendar ? 'border-primary ring-2 ring-primary/20' : ''}`}
      >
        <span className={`text-xs font-medium ${formattedValue ? 'text-gray-900' : 'text-gray-300'}`}>
          {formattedValue || placeholder}
        </span>
        <span className={`material-symbols-outlined text-sm ${showCalendar ? 'text-primary' : 'text-gray-400'}`}>calendar_today</span>
      </div>
      {error && <span className="text-[9px] text-red-600 font-bold block mt-1">{error}</span>}

      {showCalendar && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-[100] w-72 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm font-black text-gray-900">
              {monthNames[currentDate.getMonth()]} <span className="text-gray-400 font-medium">{currentDate.getFullYear()}</span>
            </span>
            <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2 text-center">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
              <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {days}
          </div>
        </div>
      )}
    </div>
  );
};