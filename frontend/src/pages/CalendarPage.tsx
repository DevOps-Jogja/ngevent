import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { normalizeEvent, type NormalizedEvent } from '../lib/event-normalize';
import { parseToWIB } from '../lib/date-wib';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    document.title = 'Kalender - NgEvent'
  }, [])

  const { data: events = [], isLoading } = useQuery<NormalizedEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await apiClient.get('/api/events');
      // Backend returns {events: [], total: 0}
      const raw = response.data.events || response.data || [];
      return (Array.isArray(raw) ? raw : []).map(normalizeEvent);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Ensure events is always an array
  const eventsList = Array.isArray(events) ? events : [];

  // Filter upcoming events (events from today onwards)
  const upcomingEvents = eventsList.filter(event =>
    (() => {
      const start = parseToWIB(event.start_date);
      return start ? start >= new Date(new Date().setHours(0, 0, 0, 0)) : false;
    })()
  ).slice(0, 5);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) => {
    return eventsList.filter((event) => {
      const start = parseToWIB(event.start_date);
      return start ? isSameDay(start, date) : false;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 pt-10">
        <div className="mb-12 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Kalender Event
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
            Lihat semua event DevOps dalam tampilan kalender
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {format(currentDate, 'MMMM yyyy', { locale: id })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-lg text-gray-900 dark:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-lg text-gray-900 dark:text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                  <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2 text-sm">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square p-2 rounded-lg border transition-all hover:border-primary-400
                        ${isCurrentMonth ? 'bg-white dark:bg-dark-secondary' : 'bg-gray-50 dark:bg-dark-primary'}
                        ${isSelected ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-600' : 'border-gray-200 dark:border-gray-700'}
                        ${isToday && !isSelected ? 'border-primary-400' : ''}
                      `}
                    >
                      <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'} ${isToday ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="flex justify-center mt-1 gap-1">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-500 rounded-full"></div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Date Events */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedDate
                    ? format(selectedDate, 'dd MMMM yyyy', { locale: id })
                    : 'Pilih Tanggal'}
                </h3>
              </div>

              {selectedDate && selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-600 hover:shadow-md transition-all bg-gray-50 dark:bg-dark-secondary group"
                    >
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {(() => {
                            const start = parseToWIB(event.start_date);
                            return start ? format(start, 'HH:mm', { locale: id }) : '-';
                          })()}
                        </p>
                        {(event.registration_fee ?? 0) > 0 && (
                          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                            Rp {(event.registration_fee ?? 0).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Tidak ada event pada tanggal ini
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Klik tanggal untuk melihat event
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Event Mendatang
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      to={`/event/${event.id}`}
                      className="block p-3 hover:bg-gray-50 dark:hover:bg-dark-secondary rounded-lg transition-colors group"
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(() => {
                          const start = parseToWIB(event.start_date);
                          return start ? format(start, 'dd MMM, HH:mm', { locale: id }) : '-';
                        })()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Tidak ada event mendatang
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
