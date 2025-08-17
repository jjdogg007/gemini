import React, { useState, useEffect } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { differenceInDays } from 'date-fns';
import { db } from '../firebase.js';

export default function EmployeePTORequestForm({ employees, ptoRequests = [], setInfoModal }) {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [reason, setReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [ptoBalance, setPtoBalance] = useState(null);

    // Filter out OPEN positions and Bank employees
    const availableEmployees = employees.filter(emp => 
        !emp.name.includes('OPEN') && emp.type !== 'Bank'
    );

    // Calculate PTO balance for selected employee
    useEffect(() => {
        if (selectedEmployee && ptoRequests) {
            const employee = employees.find(e => e.id === selectedEmployee);
            if (employee) {
                // Calculate base PTO allocation (simplified - could be based on hire date, employment type, etc.)
                const baseAllocation = employee.type === 'FT' ? 20 : 10; // Full-time: 20 days, Part-time: 10 days
                
                // Calculate used PTO (approved requests only)
                const usedPTO = ptoRequests
                    .filter(req => req.employeeId === selectedEmployee && req.status === 'approved')
                    .reduce((total, req) => {
                        if (req.startDate?.seconds && req.endDate?.seconds) {
                            return total + differenceInDays(
                                new Date(req.endDate.seconds * 1000),
                                new Date(req.startDate.seconds * 1000)
                            ) + 1;
                        }
                        return total;
                    }, 0);
                
                // Calculate pending PTO
                const pendingPTO = ptoRequests
                    .filter(req => req.employeeId === selectedEmployee && req.status === 'pending')
                    .reduce((total, req) => {
                        if (req.startDate?.seconds && req.endDate?.seconds) {
                            return total + differenceInDays(
                                new Date(req.endDate.seconds * 1000),
                                new Date(req.startDate.seconds * 1000)
                            ) + 1;
                        }
                        return total;
                    }, 0);

                setPtoBalance({
                    total: baseAllocation,
                    used: usedPTO,
                    pending: pendingPTO,
                    available: baseAllocation - usedPTO - pendingPTO
                });
            }
        } else {
            setPtoBalance(null);
        }
    }, [selectedEmployee, employees, ptoRequests]);

    const calculateRequestDays = () => {
        if (!startDate || !endDate) return 0;
        return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!selectedEmployee) {
            newErrors.employee = 'Please select an employee';
        }
        
        if (!reason.trim()) {
            newErrors.reason = 'Please enter a reason for time off';
        }
        
        if (!startDate) {
            newErrors.startDate = 'Please select a start date';
        }
        
        if (!endDate) {
            newErrors.endDate = 'Please select an end date';
        }
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            newErrors.endDate = 'End date cannot be before start date';
        }

        // Validate PTO balance
        if (ptoBalance && startDate && endDate) {
            const requestDays = calculateRequestDays();
            if (requestDays > ptoBalance.available) {
                newErrors.balance = `Insufficient PTO balance. Requesting ${requestDays} days but only ${ptoBalance.available} days available.`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        
        try {
            const ptoRequestsCollectionRef = collection(db, "pto_requests");
            await addDoc(ptoRequestsCollectionRef, {
                employeeId: selectedEmployee,
                reason: reason.trim(),
                startDate: Timestamp.fromDate(new Date(startDate)),
                endDate: Timestamp.fromDate(new Date(endDate)),
                submittedAt: Timestamp.now(),
                status: 'pending'
            });

            // Reset form
            setSelectedEmployee('');
            setReason('');
            setStartDate('');
            setEndDate('');
            setErrors({});

            setInfoModal({ 
                title: "Success", 
                message: "PTO request submitted successfully! Your manager will review and respond shortly." 
            });
        } catch (error) {
            console.error("Error submitting PTO request:", error);
            setInfoModal({ 
                title: "Error", 
                message: "Failed to submit PTO request. Please try again." 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearForm = () => {
        setSelectedEmployee('');
        setReason('');
        setStartDate('');
        setEndDate('');
        setErrors({});
    };

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Submit PTO Request</h2>
                    <p className="text-gray-400 mt-1">Request time off by filling out the form below.</p>
                </div>
            </header>
            
            <div className="bg-gray-800 rounded-lg shadow-inner p-8 max-w-2xl">
                {/* PTO Balance Display */}
                {ptoBalance && (
                    <div className="bg-gray-700 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">PTO Balance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-gray-400">Total</p>
                                <p className="text-white font-bold">{ptoBalance.total} days</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Used</p>
                                <p className="text-red-300 font-bold">{ptoBalance.used} days</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Pending</p>
                                <p className="text-yellow-300 font-bold">{ptoBalance.pending} days</p>
                            </div>
                            <div>
                                <p className="text-gray-400">Available</p>
                                <p className="text-green-300 font-bold">{ptoBalance.available} days</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Request Days Calculation */}
                {startDate && endDate && (
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                        <p className="text-blue-200">
                            <span className="font-semibold">Request Summary:</span> {calculateRequestDays()} day(s) 
                            {ptoBalance && (
                                <span className={`ml-2 ${calculateRequestDays() <= ptoBalance.available ? 'text-green-300' : 'text-red-300'}`}>
                                    ({calculateRequestDays() <= ptoBalance.available ? 'Within balance' : 'Exceeds available balance'})
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Balance Error */}
                {errors.balance && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
                        <p className="text-red-300">{errors.balance}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="employee" className="block text-sm font-medium text-gray-300 mb-2">
                            Employee <span className="text-red-400">*</span>
                        </label>
                        <select
                            id="employee"
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className={`w-full bg-gray-700 border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.employee ? 'border-red-500' : 'border-gray-600'
                            }`}
                        >
                            <option value="">Select an employee...</option>
                            {availableEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                </option>
                            ))}
                        </select>
                        {errors.employee && <p className="mt-1 text-sm text-red-400">{errors.employee}</p>}
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
                            Reason for Time Off <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={`w-full bg-gray-700 border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.reason ? 'border-red-500' : 'border-gray-600'
                            }`}
                            placeholder="e.g., Vacation, Sick, Personal"
                        />
                        {errors.reason && <p className="mt-1 text-sm text-red-400">{errors.reason}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                                Start Date <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`w-full bg-gray-700 border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                    errors.startDate ? 'border-red-500' : 'border-gray-600'
                                }`}
                            />
                            {errors.startDate && <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>}
                        </div>

                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                                End Date <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`w-full bg-gray-700 border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                    errors.endDate ? 'border-red-500' : 'border-gray-600'
                                }`}
                            />
                            {errors.endDate && <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>}
                        </div>
                    </div>

                    <div className="flex justify-between pt-6">
                        <button
                            type="button"
                            onClick={clearForm}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}