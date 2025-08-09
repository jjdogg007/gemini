import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday, getDay } from 'date-fns';

export default function PTOCalendarPage({ employees, ptoRequests }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get approved PTO requests for the current month
    const approvedPTOForMonth = useMemo(() => {
        return ptoRequests.filter(request => {
            if (request.status !== 'approved' || !request.startDate?.seconds || !request.endDate?.seconds) {
                return false;
            }
            
            const startDate = new Date(request.startDate.seconds * 1000);
            const endDate = new Date(request.endDate.seconds * 1000);
            
            // Check if the request overlaps with the current month
            return startDate <= monthEnd && endDate >= monthStart;
        });
    }, [ptoRequests, monthStart, monthEnd]);

    const getPTOForDate = (date) => {
        return approvedPTOForMonth.filter(request => {
            const startDate = new Date(request.startDate.seconds * 1000);
            const endDate = new Date(request.endDate.seconds * 1000);
            return date >= startDate && date <= endDate;
        });
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee ? employee.name.split(',')[0] : 'Unknown'; // Get first name only for space
    };

    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Create calendar grid with leading/trailing days for proper week layout
    const calendarDays = useMemo(() => {
        const firstDay = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.
        const daysFromPrevMonth = [];
        const daysFromNextMonth = [];

        // Add leading days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = new Date(monthStart);
            day.setDate(day.getDate() - (i + 1));
            daysFromPrevMonth.push(day);
        }

        // Add trailing days from next month to complete the last week
        const totalCells = daysFromPrevMonth.length + monthDays.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days = 42 cells max
        for (let i = 1; i <= remainingCells; i++) {
            const day = new Date(monthEnd);
            day.setDate(day.getDate() + i);
            daysFromNextMonth.push(day);
        }

        return [...daysFromPrevMonth, ...monthDays, ...daysFromNextMonth];
    }, [monthStart, monthEnd, monthDays]);

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">PTO Calendar</h2>
                    <p className="text-gray-400 mt-1">View approved time off requests on the calendar.</p>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={goToToday}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Today
                    </button>
                </div>
            </header>

            {/* Calendar Header */}
            <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => navigateMonth('prev')}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    
                    <h3 className="text-2xl font-bold text-white">
                        {format(currentDate, 'MMMM yyyy')}
                    </h3>
                    
                    <button 
                        onClick={() => navigateMonth('next')}
                        className="text-gray-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isCurrentDay = isToday(day);
                        const ptoForDay = getPTOForDate(day);
                        
                        return (
                            <div 
                                key={index} 
                                className={`
                                    min-h-24 p-2 border border-gray-700 
                                    ${isCurrentMonth ? 'bg-gray-700' : 'bg-gray-800 opacity-50'}
                                    ${isCurrentDay ? 'ring-2 ring-indigo-500' : ''}
                                    hover:bg-gray-600 transition-colors
                                `}
                            >
                                <div className={`text-sm font-medium mb-1 ${
                                    isCurrentMonth ? 'text-white' : 'text-gray-500'
                                }`}>
                                    {format(day, 'd')}
                                </div>
                                
                                {/* PTO Indicators */}
                                <div className="space-y-1">
                                    {ptoForDay.slice(0, 3).map((pto, ptoIndex) => (
                                        <div 
                                            key={ptoIndex}
                                            className="text-xs bg-green-600 text-white px-1 py-0.5 rounded truncate"
                                            title={`${getEmployeeName(pto.employeeId)} - ${pto.reason}`}
                                        >
                                            {getEmployeeName(pto.employeeId)}
                                        </div>
                                    ))}
                                    {ptoForDay.length > 3 && (
                                        <div className="text-xs text-gray-400">
                                            +{ptoForDay.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                        <span className="text-gray-300">Approved PTO</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-indigo-500 rounded mr-2"></div>
                        <span className="text-gray-300">Today</span>
                    </div>
                </div>
            </div>

            {/* PTO Summary for Current Month */}
            <div className="mt-6 bg-gray-800 rounded-lg shadow-inner p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    PTO Summary for {format(currentDate, 'MMMM yyyy')}
                </h3>
                
                {approvedPTOForMonth.length === 0 ? (
                    <p className="text-gray-400">No approved PTO requests this month.</p>
                ) : (
                    <div className="space-y-2">
                        {approvedPTOForMonth.map(request => (
                            <div key={request.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                                <div>
                                    <span className="text-white font-medium">
                                        {getEmployeeName(request.employeeId)}
                                    </span>
                                    <span className="text-gray-400 ml-2">
                                        {request.reason}
                                    </span>
                                </div>
                                <div className="text-gray-300 text-sm">
                                    {format(new Date(request.startDate.seconds * 1000), 'MMM d')} - {format(new Date(request.endDate.seconds * 1000), 'MMM d')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}