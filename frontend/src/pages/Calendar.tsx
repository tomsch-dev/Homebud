import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calendarApi, CalendarEvent, CreateCalendarEvent } from '../api/calendar';
import { useToast } from '../components/Toast';

const COLORS = ['emerald', 'blue', 'red', 'amber', 'purple', 'pink'] as const;
const COLOR_MAP: Record<string, { bg: string; dot: string; text: string }> = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  red: { bg: 'bg-red-100 dark:bg-red-500/20', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-500/20', dot: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300' },
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState<string>('emerald');

  const loadEvents = () => {
    const start = toDateStr(year, month, 1);
    const end = toDateStr(year, month, daysInMonth(year, month));
    calendarApi.getAll(start, end).then(setEvents);
  };

  useEffect(() => { loadEvents(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.event_date]) map[e.event_date] = [];
      map[e.event_date].push(e);
    });
    return map;
  }, [events]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
  const totalDays = daysInMonth(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const weekDays = i18n.language.startsWith('de')
    ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const monthNames = i18n.language.startsWith('de')
    ? ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const resetForm = () => {
    setTitle(''); setDescription(''); setAllDay(true); setStartTime('09:00'); setEndTime('10:00'); setColor('emerald'); setEditId(null); setShowForm(false);
  };

  const openAdd = (dateStr: string) => {
    resetForm();
    setSelectedDate(dateStr);
    setShowForm(true);
  };

  const startEdit = (e: CalendarEvent) => {
    setTitle(e.title);
    setDescription(e.description || '');
    setAllDay(e.all_day);
    setStartTime(e.start_time || '09:00');
    setEndTime(e.end_time || '10:00');
    setColor(e.color);
    setEditId(e.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedDate) return;
    const data: CreateCalendarEvent = {
      title: title.trim(),
      description: description.trim() || undefined,
      event_date: selectedDate,
      all_day: allDay,
      start_time: allDay ? undefined : startTime,
      end_time: allDay ? undefined : endTime,
      color,
    };
    if (editId) {
      const updated = await calendarApi.update(editId, data);
      setEvents((prev) => prev.map((e) => (e.id === editId ? updated : e)));
    } else {
      const created = await calendarApi.create(data);
      setEvents((prev) => [...prev, created]);
    }
    toast.success(t('calendar.saved'));
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await calendarApi.delete(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success(t('calendar.deleted'));
  };

  const dayEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const inputCls = 'w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]';

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('calendar.title')}</h1>

      {/* Month navigation */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{monthNames[month]} {year}</h2>
            <button onClick={goToday} className="px-2.5 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
              {t('calendar.today')}
            </button>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateStr = toDateStr(year, month, day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayEvts = eventsByDate[dateStr] || [];

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-sm transition-all relative ${
                  isSelected
                    ? 'bg-emerald-500 text-white font-bold shadow-md'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-300 dark:ring-emerald-500/40'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span>{day}</span>
                {dayEvts.length > 0 && (
                  <div className="flex gap-0.5">
                    {dayEvts.slice(0, 3).map((e) => (
                      <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : (COLOR_MAP[e.color]?.dot || 'bg-gray-400')}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={() => openAdd(selectedDate)}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              + {t('calendar.addEvent')}
            </button>
          </div>

          {/* Event form */}
          {showForm && (
            <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/50">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder={t('calendar.eventTitle')} />
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder={t('calendar.description')} />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('calendar.allDay')}</span>
                </label>
              </div>

              {!allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('calendar.startTime')}</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('calendar.endTime')}</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('calendar.color')}</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full ${COLOR_MAP[c].dot} transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={!title.trim()}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-semibold">
                  {editId ? t('common.save') : t('calendar.addEvent')}
                </button>
                <button onClick={resetForm}
                  className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Day events */}
          {dayEvents.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t('calendar.noEvents')}</p>
          )}
          {dayEvents.map((e) => {
            const c = COLOR_MAP[e.color] || COLOR_MAP.emerald;
            return (
              <div key={e.id} className={`${c.bg} rounded-xl p-3 flex items-start gap-3`}>
                <div className={`w-1 h-full min-h-[40px] rounded-full ${c.dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${c.text}`}>{e.title}</p>
                  {e.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{e.description}</p>}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {e.all_day ? t('calendar.allDay') : `${e.start_time} - ${e.end_time}`}
                  </p>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button onClick={() => startEdit(e)} className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
