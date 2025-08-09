import React, { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const db = getFirestore();

export default function EmployeePTOHistoryPage({ employees, ptoRequests, currentEmployeeId, setInfoModal }) {
    const [employee, setEmployee] = useState(null);
    const [employeeRequests, setEmployeeRequests] = useState([]);
    const [editingRequest, setEditingRequest] = useState(null);
    const [editForm, setEditForm] = useState({
        reason: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (currentEmployeeId && employees.length > 0) {
            const emp = employees.find(e => e.id === currentEmployeeId);
            setEmployee(emp);
            
            // Filter requests for current employee
            const requests = ptoRequests.filter(req => req.employeeId === currentEmployeeId);
            // Sort by submission date (newest first)
            const sortedRequests = requests.sort((a, b) => 
                (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)
            );
            setEmployeeRequests(sortedRequests);
        }
    }, [currentEmployeeId, employees, ptoRequests]);

    const calculateRequestDays = (request) => {
        if (!request.startDate?.seconds || !request.endDate?.seconds) return 0;
        return differenceInDays(
            new Date(request.endDate.seconds * 1000),
            new Date(request.startDate.seconds * 1000)
        ) + 1;
    };

    const getStatusBadge = (status) => {
        const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
        switch (status) {
            case 'approved':
                return `${baseClasses} bg-green-900 text-green-300`;
            case 'denied':
                return `${baseClasses} bg-red-900 text-red-300`;
            default:
                return `${baseClasses} bg-yellow-900 text-yellow-300`;
        }
    };

    const getTotalDaysUsed = () => {
        return employeeRequests
            .filter(req => req.status === 'approved')
            .reduce((total, req) => total + calculateRequestDays(req), 0);
    };

    const getCurrentYearRequests = () => {
        const currentYear = new Date().getFullYear();
        return employeeRequests.filter(req => {
            if (!req.startDate?.seconds) return false;
            const requestYear = new Date(req.startDate.seconds * 1000).getFullYear();
            return requestYear === currentYear;
        });
    };

    const handleEditRequest = (request) => {
        setEditingRequest(request.id);
        setEditForm({
            reason: request.reason,
            startDate: request.startDate?.seconds 
                ? format(new Date(request.startDate.seconds * 1000), 'yyyy-MM-dd') 
                : '',
            endDate: request.endDate?.seconds 
                ? format(new Date(request.endDate.seconds * 1000), 'yyyy-MM-dd') 
                : ''
        });
    };

    const handleCancelEdit = () => {
        setEditingRequest(null);
        setEditForm({ reason: '', startDate: '', endDate: '' });
    };

    const handleUpdateRequest = async (requestId) => {
        try {
            const requestRef = doc(db, "pto_requests", requestId);
            await updateDoc(requestRef, {
                reason: editForm.reason,
                startDate: new Date(editForm.startDate),
                endDate: new Date(editForm.endDate)
            });
            
            setEditingRequest(null);
            setEditForm({ reason: '', startDate: '', endDate: '' });
            setInfoModal({ 
                title: "Success", 
                message: "PTO request updated successfully." 
            });
        } catch (error) {
            console.error("Error updating PTO request:", error);
            setInfoModal({ 
                title: "Error", 
                message: "Failed to update PTO request. Please try again." 
            });
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (window.confirm("Are you sure you want to cancel this PTO request?")) {
            try {
                const requestRef = doc(db, "pto_requests", requestId);
                await deleteDoc(requestRef);
                
                setInfoModal({ 
                    title: "Success", 
                    message: "PTO request cancelled successfully." 
                });
            } catch (error) {
                console.error("Error cancelling PTO request:", error);
                setInfoModal({ 
                    title: "Error", 
                    message: "Failed to cancel PTO request. Please try again." 
                });
            }
        }
    };

    if (!employee) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4">Employee Not Found</h2>
                <p className="text-gray-400">Please select a valid employee to view PTO history.</p>
            </div>
        );
    }

    const currentYearRequests = getCurrentYearRequests();
    const totalDaysUsed = getTotalDaysUsed();

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">PTO Request History</h2>
                    <p className="text-gray-400 mt-1">View all your PTO requests and their current status.</p>
                </div>
            </header>

            {/* Employee Summary */}
            <div className="bg-gray-800 rounded-lg shadow-inner p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Employee Details</h3>
                        <p className="text-gray-300">{employee.name}</p>
                        <p className="text-gray-400 text-sm">{employee.department || 'Operations'}</p>
                        <p className="text-gray-400 text-sm">{employee.position || employee.type}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">This Year</h3>
                        <p className="text-gray-300">{currentYearRequests.length} Requests</p>
                        <p className="text-gray-400 text-sm">{totalDaysUsed} Days Used</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Status Summary</h3>
                        <div className="space-y-1 text-sm">
                            <p className="text-green-300">
                                Approved: {employeeRequests.filter(r => r.status === 'approved').length}
                            </p>
                            <p className="text-yellow-300">
                                Pending: {employeeRequests.filter(r => r.status === 'pending').length}
                            </p>
                            <p className="text-red-300">
                                Denied: {employeeRequests.filter(r => r.status === 'denied').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-gray-800 rounded-lg shadow-inner">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Date Submitted
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Dates Requested
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Days
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {employeeRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-gray-500">
                                        No PTO requests found.
                                    </td>
                                </tr>
                            ) : (
                                employeeRequests.map(request => (
                                    <tr key={request.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.submittedAt?.seconds 
                                                ? format(new Date(request.submittedAt.seconds * 1000), 'MMM d, yyyy')
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {editingRequest === request.id ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="date"
                                                        value={editForm.startDate}
                                                        onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                    <input
                                                        type="date"
                                                        value={editForm.endDate}
                                                        onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                                                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                request.startDate?.seconds && request.endDate?.seconds 
                                                    ? `${format(new Date(request.startDate.seconds * 1000), 'MMM d, yyyy')} - ${format(new Date(request.endDate.seconds * 1000), 'MMM d, yyyy')}`
                                                    : 'N/A'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {editingRequest === request.id && editForm.startDate && editForm.endDate
                                                ? differenceInDays(new Date(editForm.endDate), new Date(editForm.startDate)) + 1
                                                : calculateRequestDays(request)
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {editingRequest === request.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.reason}
                                                    onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                                    placeholder="Reason for time off"
                                                />
                                            ) : (
                                                request.reason
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={getStatusBadge(request.status)}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {editingRequest === request.id ? (
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => handleUpdateRequest(request.id)}
                                                        className="text-green-400 hover:text-green-300"
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        onClick={handleCancelEdit}
                                                        className="text-gray-400 hover:text-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : request.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => handleEditRequest(request)}
                                                        className="text-indigo-400 hover:text-indigo-300"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCancelRequest(request.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
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