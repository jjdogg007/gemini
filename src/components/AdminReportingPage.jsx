import React, { useState, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';

export default function AdminReportingPage({ employees, ptoRequests, setInfoModal }) {
    const [filters, setFilters] = useState({
        department: '',
        startDate: '',
        endDate: '',
        status: '',
        employee: ''
    });

    // Get unique departments
    const departments = useMemo(() => {
        const depts = employees.map(emp => emp.department || 'Operations');
        return [...new Set(depts)];
    }, [employees]);

    // Filter PTO requests based on current filters
    const filteredRequests = useMemo(() => {
        return ptoRequests.filter(request => {
            const employee = employees.find(emp => emp.id === request.employeeId);
            
            // Department filter
            if (filters.department && employee?.department !== filters.department) {
                return false;
            }
            
            // Employee filter
            if (filters.employee && request.employeeId !== filters.employee) {
                return false;
            }
            
            // Status filter
            if (filters.status && request.status !== filters.status) {
                return false;
            }
            
            // Date range filter
            if (filters.startDate && request.startDate?.seconds) {
                const requestStart = new Date(request.startDate.seconds * 1000);
                if (requestStart < new Date(filters.startDate)) {
                    return false;
                }
            }
            
            if (filters.endDate && request.endDate?.seconds) {
                const requestEnd = new Date(request.endDate.seconds * 1000);
                if (requestEnd > new Date(filters.endDate)) {
                    return false;
                }
            }
            
            return true;
        });
    }, [ptoRequests, employees, filters]);

    // Calculate statistics
    const stats = useMemo(() => {
        const totalRequests = filteredRequests.length;
        const approvedRequests = filteredRequests.filter(r => r.status === 'approved').length;
        const pendingRequests = filteredRequests.filter(r => r.status === 'pending').length;
        const deniedRequests = filteredRequests.filter(r => r.status === 'denied').length;
        
        const totalDaysRequested = filteredRequests.reduce((sum, request) => {
            if (request.startDate?.seconds && request.endDate?.seconds) {
                return sum + differenceInDays(
                    new Date(request.endDate.seconds * 1000),
                    new Date(request.startDate.seconds * 1000)
                ) + 1;
            }
            return sum;
        }, 0);

        const approvedDays = filteredRequests
            .filter(r => r.status === 'approved')
            .reduce((sum, request) => {
                if (request.startDate?.seconds && request.endDate?.seconds) {
                    return sum + differenceInDays(
                        new Date(request.endDate.seconds * 1000),
                        new Date(request.startDate.seconds * 1000)
                    ) + 1;
                }
                return sum;
            }, 0);

        return {
            totalRequests,
            approvedRequests,
            pendingRequests,
            deniedRequests,
            totalDaysRequested,
            approvedDays
        };
    }, [filteredRequests]);

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee ? employee.name : 'Unknown';
    };

    const getEmployeeDepartment = (employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee ? (employee.department || 'Operations') : 'Unknown';
    };

    const clearFilters = () => {
        setFilters({
            department: '',
            startDate: '',
            endDate: '',
            status: '',
            employee: ''
        });
    };

    const exportToCSV = () => {
        try {
            const headers = [
                'Employee Name',
                'Department',
                'Request Date',
                'Start Date',
                'End Date',
                'Days Requested',
                'Reason',
                'Status'
            ];

            const csvData = filteredRequests.map(request => [
                getEmployeeName(request.employeeId),
                getEmployeeDepartment(request.employeeId),
                request.submittedAt?.seconds 
                    ? format(new Date(request.submittedAt.seconds * 1000), 'yyyy-MM-dd')
                    : '',
                request.startDate?.seconds 
                    ? format(new Date(request.startDate.seconds * 1000), 'yyyy-MM-dd')
                    : '',
                request.endDate?.seconds 
                    ? format(new Date(request.endDate.seconds * 1000), 'yyyy-MM-dd')
                    : '',
                request.startDate?.seconds && request.endDate?.seconds
                    ? differenceInDays(
                        new Date(request.endDate.seconds * 1000),
                        new Date(request.startDate.seconds * 1000)
                    ) + 1
                    : 0,
                request.reason || '',
                request.status || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => 
                    row.map(field => 
                        typeof field === 'string' && field.includes(',') 
                            ? `"${field.replace(/"/g, '""')}"` 
                            : field
                    ).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `pto_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setInfoModal({
                title: "Success",
                message: "PTO report exported successfully!"
            });
        } catch (error) {
            console.error('Error exporting CSV:', error);
            setInfoModal({
                title: "Error",
                message: "Failed to export report. Please try again."
            });
        }
    };

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Admin Reporting</h2>
                    <p className="text-gray-400 mt-1">Generate and export PTO reports with advanced filtering.</p>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={exportToCSV}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        disabled={filteredRequests.length === 0}
                    >
                        Export CSV
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg shadow-inner p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Department
                        </label>
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({...filters, department: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Employee
                        </label>
                        <select
                            value={filters.employee}
                            onChange={(e) => setFilters({...filters, employee: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Employees</option>
                            {employees.filter(emp => !emp.name.includes('OPEN') && emp.type !== 'Bank').map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Start Date (From)
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            End Date (To)
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Total Requests</h4>
                    <p className="text-3xl font-bold text-indigo-400">{stats.totalRequests}</p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Approved</h4>
                    <p className="text-3xl font-bold text-green-400">{stats.approvedRequests}</p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Pending</h4>
                    <p className="text-3xl font-bold text-yellow-400">{stats.pendingRequests}</p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Denied</h4>
                    <p className="text-3xl font-bold text-red-400">{stats.deniedRequests}</p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Total Days</h4>
                    <p className="text-3xl font-bold text-blue-400">{stats.totalDaysRequested}</p>
                </div>
                <div className="bg-gray-800 rounded-lg shadow-inner p-6">
                    <h4 className="text-lg font-semibold text-white mb-2">Approved Days</h4>
                    <p className="text-3xl font-bold text-green-400">{stats.approvedDays}</p>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-gray-800 rounded-lg shadow-inner">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-10 text-gray-500">
                                        No PTO requests match the current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map(request => (
                                    <tr key={request.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {getEmployeeName(request.employeeId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {getEmployeeDepartment(request.employeeId)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.submittedAt?.seconds 
                                                ? format(new Date(request.submittedAt.seconds * 1000), 'MMM d, yyyy')
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.startDate?.seconds && request.endDate?.seconds
                                                ? `${format(new Date(request.startDate.seconds * 1000), 'MMM d')} - ${format(new Date(request.endDate.seconds * 1000), 'MMM d')}`
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.startDate?.seconds && request.endDate?.seconds
                                                ? differenceInDays(
                                                    new Date(request.endDate.seconds * 1000),
                                                    new Date(request.startDate.seconds * 1000)
                                                ) + 1
                                                : 0
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                request.status === 'approved' ? 'bg-green-900 text-green-300' :
                                                request.status === 'denied' ? 'bg-red-900 text-red-300' :
                                                'bg-yellow-900 text-yellow-300'
                                            }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}