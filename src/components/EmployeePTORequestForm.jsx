import React, { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const db = getFirestore();

export default function EmployeePTORequestForm({ employees, setInfoModal }) {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [reason, setReason] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Filter out OPEN positions and Bank employees
    const availableEmployees = employees.filter(emp => 
        !emp.name.includes('OPEN') && emp.type !== 'Bank'
    );

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