"use client";

import { useState } from "react";
import { useFamily } from "@/contexts/FamilyContext";
import styles from "./CalendarBoard.module.css";
import { IconArrowLeft, IconArrowRight, IconUser, IconTrash } from "./Icons";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Mock current user
const CURRENT_USER = "dad";

export default function CalendarBoard() {
    const { selectedChildId, childrenProfiles, events, addEvent, removeEvent } = useFamily();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [newChildIds, setNewChildIds] = useState<string[]>([]);
    const [newEndDate, setNewEndDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventType, setNewEventType] = useState<"custody" | "activity" | "expense">("activity");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [view, setView] = useState<"month" | "week">("month");

    // Recurring event states
    const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
    const [recurringTitle, setRecurringTitle] = useState("");
    const [recurringType, setRecurringType] = useState<"custody" | "activity" | "expense">("activity");
    const [recurringStartDate, setRecurringStartDate] = useState("");
    const [recurringEndDate, setRecurringEndDate] = useState("");
    const [recurringStartTime, setRecurringStartTime] = useState("");
    const [recurringEndTime, setRecurringEndTime] = useState("");
    const [recurringWeekdays, setRecurringWeekdays] = useState<number[]>([]);
    const [recurringChildIds, setRecurringChildIds] = useState<string[]>([]);

    const isEventOnDate = (event: any, dateStr: string) => {
        if (!event.endDate) return event.date === dateStr;
        return dateStr >= event.date && dateStr <= event.endDate;
    };

    const filteredEvents = selectedChildId === 'all'
        ? events
        : events.filter(e => !e.childIds || e.childIds.length === 0 || e.childIds.includes(selectedChildId));

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const changeDateRange = (offset: number) => {
        if (view === "month") {
            setCurrentDate(new Date(year, month + offset, 1));
        } else {
            const nextWeek = new Date(currentDate);
            nextWeek.setDate(currentDate.getDate() + (offset * 7));
            setCurrentDate(nextWeek);
        }
    };

    const getWeekDays = (baseDate: Date) => {
        const date = new Date(baseDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const monday = new Date(date.setDate(diff));

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            week.push(d);
        }
        return week;
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const calendarDays = [];

    const handleDayClick = (dateStr: string) => {
        setSelectedDate(dateStr);
        setNewEndDate(null);
        // Default to current selection context if specific, else empty (all)
        setNewChildIds(selectedChildId === 'all' ? [] : [selectedChildId]);
        setIsModalOpen(true);
    };

    const selectedDayEvents = selectedDate
        ? filteredEvents.filter(e => isEventOnDate(e, selectedDate))
        : [];

    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !newEventTitle) return;

        const newEvent = {
            id: Date.now().toString(),
            date: selectedDate,
            endDate: newEndDate || undefined,
            title: newEventTitle,
            type: newEventType,
            assignedTo: newEventType === 'custody' ? CURRENT_USER : (undefined as any),
            createdBy: CURRENT_USER as "dad" | "mom",
            childIds: newChildIds.length > 0 ? newChildIds : undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined
        };

        addEvent(newEvent as any);
        setNewEventTitle("");
        setStartTime("");
        setEndTime("");
        setNewChildIds([]);
        setNewEndDate(null);
    };

    const toggleChildSelection = (childId: string) => {
        setNewChildIds((prev: string[]) =>
            prev.includes(childId)
                ? prev.filter((id: string) => id !== childId)
                : [...prev, childId]
        );
    };

    const handleDeleteEvent = (id: string, createdBy: "mom" | "dad") => {
        if (createdBy !== CURRENT_USER) {
            alert("Solo puedes eliminar eventos creados por ti.");
            return;
        }
        if (confirm("¿Seguro que quieres eliminar este evento?")) {
            removeEvent(id);
        }
    };

    const toggleRecurringWeekday = (day: number) => {
        setRecurringWeekdays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const toggleRecurringChildSelection = (childId: string) => {
        setRecurringChildIds(prev =>
            prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
        );
    };

    const handleCreateRecurringEvent = (e: React.FormEvent) => {
        e.preventDefault();

        if (!recurringTitle || !recurringStartDate || !recurringEndDate || recurringWeekdays.length === 0) {
            alert("Por favor completa todos los campos requeridos y selecciona al menos un día de la semana.");
            return;
        }

        const startDate = new Date(recurringStartDate);
        const endDate = new Date(recurringEndDate);

        if (startDate > endDate) {
            alert("La fecha de inicio debe ser anterior a la fecha de fin.");
            return;
        }

        // Generate events for each matching weekday in the date range
        const currentDate = new Date(startDate);
        let eventsCreated = 0;

        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            // Convert Sunday (0) to 6, Monday (1) to 0, etc.
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            if (recurringWeekdays.includes(adjustedDay)) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                const newEvent = {
                    id: `${Date.now()}-${eventsCreated}`,
                    date: dateStr,
                    title: recurringTitle,
                    type: recurringType,
                    assignedTo: recurringType === 'custody' ? CURRENT_USER : (undefined as any),
                    createdBy: CURRENT_USER as "dad" | "mom",
                    childIds: recurringChildIds.length > 0 ? recurringChildIds : undefined,
                    startTime: recurringStartTime || undefined,
                    endTime: recurringEndTime || undefined,
                    isRecurring: true
                };

                addEvent(newEvent as any);
                eventsCreated++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        alert(`Se crearon ${eventsCreated} eventos periódicos.`);

        // Reset form
        setRecurringTitle("");
        setRecurringStartDate("");
        setRecurringEndDate("");
        setRecurringStartTime("");
        setRecurringEndTime("");
        setRecurringWeekdays([]);
        setRecurringChildIds([]);
        setIsRecurringModalOpen(false);
    };

    // Monthly Grid Logic
    if (view === "month") {
        // Add empty slots for month view
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = filteredEvents.filter(e => isEventOnDate(e, dateStr));
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            calendarDays.push(
                <div
                    key={day}
                    className={`${styles.day} ${isToday ? styles.today : ''}`}
                    onClick={() => handleDayClick(dateStr)}
                >
                    <div className={styles.dayNumber}>{day}</div>
                    <div className={styles.events}>
                        {dayEvents.map(event => (
                            <div
                                key={event.id}
                                className={`${styles.event} ${styles[event.type]} ${event.assignedTo ? styles[event.assignedTo] : ''}`}
                            >
                                <div className={styles.eventDot}></div>
                                <span className={styles.eventTitle}>{event.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    } else {
        // Weekly Grid Logic
        const weekDays = getWeekDays(currentDate);
        const weekRangeText = `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()]} - ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]}`;

        weekDays.forEach((d, i) => {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const dayEvents = filteredEvents.filter(e => isEventOnDate(e, dateStr));
            const isToday = new Date().toDateString() === d.toDateString();

            calendarDays.push(
                <div
                    key={`week-${i}`}
                    className={`${styles.weekDayCell} ${isToday ? styles.today : ''}`}
                    onClick={() => handleDayClick(dateStr)}
                >
                    <div className={styles.weekDayHeader}>
                        <span className={styles.weekDayName}>{DAYS[i]}</span>
                        <span className={styles.weekDayNumber}>{d.getDate()}</span>
                    </div>
                    <div className={styles.weekEvents}>
                        {dayEvents.length === 0 ? (
                            <p className={styles.emptyWeekText}>Sin eventos</p>
                        ) : (
                            dayEvents.map(event => (
                                <div
                                    key={event.id}
                                    className={`${styles.largeEvent} ${styles[event.type]} ${event.assignedTo ? styles[event.assignedTo] : ''}`}
                                >
                                    <div className={styles.eventDot}></div>
                                    <div className={styles.eventContent}>
                                        <span className={styles.largeEventTitle}>{event.title}</span>
                                        {event.startTime && <span className={styles.largeEventTime}>{event.startTime}</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            );
        });
    }

    return (
        <>
            <div className={styles.board}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.monthNav}>
                            <button onClick={() => changeDateRange(-1)} className={styles.navBtn}><IconArrowLeft size={24} /></button>
                            <h2 className={styles.monthTitle}>
                                {view === 'month' ? `${MONTHS[month]} ${year}` : 'Esta Semana'}
                            </h2>
                            <button onClick={() => changeDateRange(1)} className={styles.navBtn}><IconArrowRight size={24} /></button>
                        </div>

                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.toggleBtn} ${view === 'month' ? styles.active : ''}`}
                                onClick={() => setView('month')}
                            >
                                Mes
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${view === 'week' ? styles.active : ''}`}
                                onClick={() => setView('week')}
                            >
                                Semana
                            </button>
                        </div>

                        <div className={styles.headerButtons}>
                            <button
                                className={styles.addEventMainBtn}
                                onClick={() => {
                                    const today = new Date();
                                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                    handleDayClick(dateStr);
                                }}
                            >
                                + Nuevo Evento
                            </button>
                            <button
                                className={styles.recurringBtn}
                                onClick={() => {
                                    setRecurringChildIds(selectedChildId === 'all' ? [] : [selectedChildId]);
                                    setIsRecurringModalOpen(true);
                                }}
                            >
                                + Evento Periódico
                            </button>
                        </div>
                    </div>
                </header>

                <div className={`${styles.grid} ${view === 'week' ? styles.weekGrid : ''}`}>
                    {view === 'month' && DAYS.map(day => (
                        <div key={day} className={styles.dayName}>{day}</div>
                    ))}
                    {calendarDays}
                </div>
            </div>

            {isModalOpen && selectedDate && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Eventos del {selectedDate}</h3>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.eventList}>
                                {selectedDayEvents.length === 0 ? (
                                    <p className={styles.noEvents}>No hay eventos para este día.</p>
                                ) : (
                                    selectedDayEvents.map(event => (
                                        <div key={event.id} className={styles.detailEventItem}>
                                            <div className={styles.eventInfo}>
                                                <span className={`${styles.eventTypeTag} ${styles[event.type]}`}>{event.type}</span>
                                                <span className={styles.eventDetailTitle}>{event.title}</span>
                                                {(event.startTime || event.endTime) && (
                                                    <span className={styles.eventTime}>
                                                        {event.startTime && `${event.startTime}`}
                                                        {event.startTime && event.endTime && ' - '}
                                                        {event.endTime && `${event.endTime}`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.eventMeta}>
                                                {Array.isArray(event.childIds) && event.childIds.length > 0 && (
                                                    <div className={styles.childTags}>
                                                        {event.childIds.map(cid => {
                                                            const child = childrenProfiles.find(c => c.id === cid);
                                                            return child ? (
                                                                <span key={cid} className={styles.childTag} style={{ backgroundColor: child.color }}>{child.name}</span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                                <span className={styles.creatorLabel}>
                                                    <IconUser size={14} /> {event.createdBy === 'dad' ? 'Papá' : 'Mamá'}
                                                </span>
                                            </div>
                                            {event.createdBy === CURRENT_USER && (
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteEvent(event.id, event.createdBy)}
                                                >
                                                    <IconTrash size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <form onSubmit={handleCreateEvent} className={styles.createForm}>
                                <h4>Añadir Evento</h4>
                                <div className={styles.formRow}>
                                    <input
                                        type="text"
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        placeholder="Título del evento"
                                        className={styles.input}
                                        required
                                        autoFocus
                                    />
                                    <select
                                        value={newEventType}
                                        onChange={(e) => setNewEventType(e.target.value as "custody" | "activity" | "expense")}
                                        className={styles.select}
                                    >
                                        <option value="activity">Actividad</option>
                                        <option value="custody">Custodia</option>
                                        <option value="expense">Gasto</option>
                                    </select>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.timeInputGroup}>
                                        <label className={styles.timeLabel}>Desde:</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className={styles.timeInput}
                                        />
                                    </div>
                                    <div className={styles.timeInputGroup}>
                                        <label className={styles.timeLabel}>Hasta:</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className={styles.timeInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.timeInputGroup} style={{ flex: 1 }}>
                                        <label className={styles.timeLabel}>Termina el (opcional):</label>
                                        <input
                                            type="date"
                                            value={newEndDate || ""}
                                            onChange={(e) => setNewEndDate(e.target.value)}
                                            className={styles.timeInput}
                                            min={selectedDate}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.childSelector}>
                                    <span className={styles.selectorLabel}>Para:</span>
                                    <div className={styles.checkboxGroup}>
                                        {childrenProfiles.map(child => (
                                            <label key={child.id} className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={newChildIds.includes(child.id)}
                                                    onChange={() => toggleChildSelection(child.id)}
                                                />
                                                <span style={{ color: child.color }}>{child.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <span className={styles.helperText}>
                                        {newChildIds.length === 0 ? "(Para todos)" : ""}
                                    </span>
                                </div>

                                <button type="submit" className={styles.addBtn}>Guardar Evento</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isRecurringModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsRecurringModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Crear Evento Periódico</h3>
                            <button className={styles.closeBtn} onClick={() => setIsRecurringModalOpen(false)}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            <form onSubmit={handleCreateRecurringEvent} className={styles.createForm}>
                                <div className={styles.formRow}>
                                    <input
                                        type="text"
                                        value={recurringTitle}
                                        onChange={(e) => setRecurringTitle(e.target.value)}
                                        placeholder="Título del evento (ej: Fútbol)"
                                        className={styles.input}
                                        required
                                        autoFocus
                                    />
                                    <select
                                        value={recurringType}
                                        onChange={(e) => setRecurringType(e.target.value as "custody" | "activity" | "expense")}
                                        className={styles.select}
                                    >
                                        <option value="activity">Actividad</option>
                                        <option value="custody">Custodia</option>
                                        <option value="expense">Gasto</option>
                                    </select>
                                </div>

                                <div className={styles.dateRangeRow}>
                                    <div className={styles.dateInputGroup}>
                                        <label>Fecha inicio:</label>
                                        <input
                                            type="date"
                                            value={recurringStartDate}
                                            onChange={(e) => setRecurringStartDate(e.target.value)}
                                            className={styles.timeInput}
                                            required
                                        />
                                    </div>
                                    <div className={styles.dateInputGroup}>
                                        <label>Fecha fin:</label>
                                        <input
                                            type="date"
                                            value={recurringEndDate}
                                            onChange={(e) => setRecurringEndDate(e.target.value)}
                                            className={styles.timeInput}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.timeInputGroup}>
                                        <label className={styles.timeLabel}>Hora inicio:</label>
                                        <input
                                            type="time"
                                            value={recurringStartTime}
                                            onChange={(e) => setRecurringStartTime(e.target.value)}
                                            className={styles.timeInput}
                                        />
                                    </div>
                                    <div className={styles.timeInputGroup}>
                                        <label className={styles.timeLabel}>Hora fin:</label>
                                        <input
                                            type="time"
                                            value={recurringEndTime}
                                            onChange={(e) => setRecurringEndTime(e.target.value)}
                                            className={styles.timeInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.weekdaySelector}>
                                    <span className={styles.selectorLabel}>Días de la semana:</span>
                                    <div className={styles.weekdayGrid}>
                                        {DAYS.map((day, index) => (
                                            <label
                                                key={index}
                                                className={`${styles.weekdayCheckbox} ${recurringWeekdays.includes(index) ? styles.checked : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={recurringWeekdays.includes(index)}
                                                    onChange={() => toggleRecurringWeekday(index)}
                                                    style={{ display: 'none' }}
                                                />
                                                <span className={styles.weekdayLabel}>{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.childSelector}>
                                    <span className={styles.selectorLabel}>Para:</span>
                                    <div className={styles.checkboxGroup}>
                                        {childrenProfiles.map(child => (
                                            <label key={child.id} className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={recurringChildIds.includes(child.id)}
                                                    onChange={() => toggleRecurringChildSelection(child.id)}
                                                />
                                                <span style={{ color: child.color }}>{child.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <span className={styles.helperText}>
                                        {recurringChildIds.length === 0 ? "(Para todos)" : ""}
                                    </span>
                                </div>

                                <button type="submit" className={styles.addBtn}>Crear Eventos Periódicos</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
