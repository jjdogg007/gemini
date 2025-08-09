import React from 'react';

export default function PrintablePTOForm({ formData }) {
    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        window.close();
    };

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white text-black">
            {/* Print and Close buttons - hidden when printing */}
            <div className="mb-6 text-center print:hidden">
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded mr-4"
                >
                    Print Form
                </button>
                <button
                    onClick={handleClose}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded"
                >
                    Close
                </button>
            </div>

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <div className="text-sm mb-2">Employee Scheduling Department</div>
                <h1 className="text-2xl font-bold">PAID TIME OFF REQUEST FORM</h1>
            </div>

            {/* Employee Information */}
            <div className="mb-8">
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center">
                        <span className="font-bold w-48">EMPLOYEE NAME:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.employeeName}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">EMPLOYEE ID:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.employeeId}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">DEPARTMENT:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.department}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">POSITION:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.position}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">REASON FOR TIME OFF:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.reason}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">START DATE:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.startDate}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">END DATE:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.endDate}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">DATE SUBMITTED:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.dateSubmitted}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">TOTAL DAYS REQUESTED:</span>
                        <span className="border-b border-black flex-1 pl-2">{formData.totalDays}</span>
                    </div>
                </div>
            </div>

            {/* Manager Approval Section */}
            <div className="border border-black p-4 mb-8">
                <h2 className="text-lg font-bold mb-4">MANAGER APPROVAL</h2>
                
                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        <div className="w-4 h-4 border border-black mr-4"></div>
                        <span>APPROVED</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 border border-black mr-4"></div>
                        <span>DENIED</span>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center mb-4">
                        <span className="font-bold w-48">MANAGER SIGNATURE:</span>
                        <span className="border-b border-black flex-1 h-8"></span>
                    </div>
                    <div className="flex items-center mb-4">
                        <span className="font-bold w-48">DATE:</span>
                        <span className="border-b border-black flex-1 h-8"></span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-bold w-48">COMMENTS:</span>
                        <span className="border-b border-black flex-1 h-8"></span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-gray-700">
                <p className="mb-2">This form must be submitted at least 48 hours in advance for approval.</p>
                <p>Emergency requests may be considered with supervisor approval.</p>
            </div>
        </div>
    );
}