import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, getDocs, writeBatch, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isEqual, isToday, differenceInDays } from 'date-fns';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvvmjbVDSTdiHsvEV27JlBK1x1iFeO91k",
  authDomain: "myscheduler-825e0.firebaseapp.com",
  projectId: "myscheduler-825e0",
  storageBucket: "myscheduler-825e0.appspot.com",
  messagingSenderId: "1001851059822",
  appId: "1:1001851059822:web:1631000721aa8e6c02f07f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initial Data & Constants
const initialEmployees = [
    { name: 'Scales, Jack', type: 'PT', shifts: '7a-7p', availability: 'Sat,Sun', max_days: 5, target_hours: 96, email: '', hire_date: '2023-12-01', empId: 'EMP001', department: 'Operations', position: 'Part Time' },
    { name: 'Heberer, Jacob', type: 'FT', shifts: '10a-6:30p', availability: 'Mon,Tue,Wed,Thu,Fri', max_days: 5, target_hours: 160, email: '', hire_date: '2023-08-05', empId: 'EMP002', department: 'Operations', position: 'Full Time' },
    { name: 'Garcia, Mosserat', type: 'PT', shifts: '2p-10:30p', availability: 'Sat,Sun', max_days: 2, target_hours: 64, email: '', hire_date: '2024-02-20', empId: 'EMP003', department: 'Operations', position: 'Part Time' },
    { name: 'OPEN SHIFTS (Extra)', type: 'Bank', shifts: '', availability: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', max_days: null, target_hours: null, email: '', hire_date: '' },
    { name: 'OPEN POSITION', type: 'FT', shifts: '1p-9:30p', availability: 'Mon,Tue,Wed,Thu,Fri', max_days: 5, target_hours: 160, email: '', hire_date: '' },
    { name: 'OPEN SHIFTS (Coverage)', type: 'Bank', shifts: '', availability: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', max_days: null, target_hours: null, email: '', hire_date: '' },
    { name: 'Sifuentes, Stephany', type: 'FT', shifts: '6:30p-3a', availability: 'Mon,Tue,Wed,Thu,Fri', max_days: 5, target_hours: 160, email: '', hire_date: '2023-09-01', empId: 'EMP004', department: 'Operations', position: 'Full Time' },
    { name: 'Harvey-Edwin, Jean', type: 'PT', shifts: 'Varies', availability: 'Varies', max_days: 3, target_hours: 96, email: '', hire_date: '2023-11-10', empId: 'EMP005', department: 'Operations', position: 'Part Time' },
    { name: 'Thaxton, Tequita', type: 'PT', shifts: '9:30p-6a', availability: 'Mon,Tue,Wed,Thu,Fri', max_days: 5, target_hours: 96, email: '', hire_date: '2024-06-10', empId: 'EMP006', department: 'Operations', position: 'Part Time' },
    { name: 'Hosey, Dianna', type: 'PT', shifts: 'Varies', availability: 'Varies', max_days: 3, target_hours: 96, email: '', hire_date: '2024-03-12', empId: 'EMP007', department: 'Operations', position: 'Part Time' },
    { name: 'Thompson, Quientia', type: 'PT', shifts: 'Varies', availability: 'Varies', max_days: 3, target_hours: 96, email: '', hire_date: '2024-07-01', empId: 'EMP008', department: 'Operations', position: 'Part Time' },
    { name: 'OPEN POSITION', type: 'PT', shifts: '6:30p-3a', availability: 'Sat,Sun', max_days: 2, target_hours: 64, email: '', hire_date: '' },
    { name: 'Dowling, Tina', type: 'PT', shifts: '10p-6a', availability: 'Fri,Sat', max_days: 2, target_hours: 64, email: '', hire_date: '2024-01-15', empId: 'EMP009', department: 'Operations', position: 'Part Time' },
    { name: 'Keene, Shanetra', type: 'FT', shifts: '2p-10:30p', availability: 'Mon,Tue,Wed,Thu,Fri', max_days: 5, target_hours: 160, email: '', hire_date: '2023-07-18', empId: 'EMP010', department: 'Operations', position: 'Full Time' },
    { name: 'OPEN SHIFTS (Misc)', type: 'Bank', shifts: '', availability: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', max_days: null, target_hours: null, email: '', hire_date: '' },
    { name: 'Merrick, Tanya', type: 'PT', shifts: '6a-2:30p', availability: 'Sat,Sun', max_days: 2, target_hours: 64, email: '', hire_date: '2024-04-22', empId: 'EMP011', department: 'Operations', position: 'Part Time' },
    { name: 'Puebla, Alisia', type: 'PT', shifts: '10a-6:30p', availability: 'Sat,Sun', max_days: 2, target_hours: 64, email: '', hire_date: '2024-05-15', empId: 'EMP012', department: 'Operations', position: 'Part Time' },
    { name: 'Melgar, Lisa', type: 'PT', shifts: '5:30a-2p', availability: 'Mon,Tue,Wed,Thu,Fri', max_days: 5, target_hours: 120, email: '', hire_date: '2024-01-08', empId: 'EMP013', department: 'Operations', position: 'Part Time' },
];

const SHIFT_TEMPLATES = ["7a-3p", "3p-11p", "11p-7a", "7a-7p", "7p-7a", "10a-6:30p", "1p-9:30p", "6a-2:30p", "2p-10:30p", "5:30a-2p", "6:30p-3a", "9:30p-6a", "10p-6a"];

// Helper Functions
const calculateShiftDuration = (shiftTime) => {
    if (!shiftTime || typeof shiftTime !== 'string' || !shiftTime.includes('-')) return 0;
    try {
        const [startStr, endStr] = shiftTime.split('-');
        const parseTime = (timeStr) => {
            const isPM = timeStr.includes('p');
            const [hourStr, minStr] = timeStr.replace(/[ap]/, '').split(':');
            let hours = parseInt(hourStr, 10);
            const minutes = minStr ? parseInt(minStr, 10) / 60 : 0;
            if (isPM && hours !== 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            return hours + minutes;
        };
        let startTime = parseTime(startStr);
        let endTime = parseTime(endStr);
        if (endTime <= startTime) endTime += 24;
        return endTime - startTime;
    } catch (e) {
        console.error("Could not parse shift time:", shiftTime);
        return 0;
    }
};

const isEmployeeAvailable = (employee, day) => {
    if (!employee || !employee.availability || employee.availability === 'Varies' || employee.type === 'Bank') {
        return true;
    }
    const dayOfWeek = format(day, 'EEE');
    return employee.availability.includes(dayOfWeek);
};

  // Icons
const CalendarIcon = () => <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>;
const UsersIcon = () => <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 003 21v-1a6 6 0 0112 0v1z"></path></svg>;
const ClockIcon = () => <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const DocumentIcon = () => <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const ChartIcon = () => <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>;
const XIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;

// Main App Component
import EmployeePTORequestForm from './components/EmployeePTORequestForm';
import EmployeePTOHistoryPage from './components/EmployeePTOHistoryPage';
import PTOCalendarPage from './components/PTOCalendarPage';
import AdminReportingPage from './components/AdminReportingPage';
import PrintablePTOForm from './components/PrintablePTOForm';

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [ptoRequests, setPtoRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [contextMenu, setContextMenu] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Rest of the component logic will go here...
  const NavLink = ({ icon, children, isActive, onClick }) => (
    <button 
      onClick={() => {
        onClick();
        setSidebarOpen(false); // Close sidebar on mobile after clicking
      }} 
      className={`group flex items-center w-full px-4 py-2 mt-2 text-sm font-medium rounded-md text-left transition-colors duration-200 ${
        isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );

  const TimeOffCenterPage = ({ ptoRequests, employees, setInfoModal }) => {
    const getEmployeeName = (employeeId) => {
        const employee = employees.find(e => e.id === employeeId);
        return employee ? employee.name : 'Unknown';
    };

    const getEmployeeDetails = (employeeId) => {
        return employees.find(e => e.id === employeeId);
    };

    const handleApprove = async (request) => {
        const requestRef = doc(db, "pto_requests", request.id);
        await updateDoc(requestRef, { status: "approved" });
        setInfoModal({ title: "Success", message: "PTO request approved." });
    };

    const handleDeny = async (request) => {
        const requestRef = doc(db, "pto_requests", request.id);
        await updateDoc(requestRef, { status: "denied" });
        setInfoModal({ title: "Success", message: "PTO request denied." });
    };

    const handleGenerateForm = (request) => {
        const employee = getEmployeeDetails(request.employeeId);
        if (!employee) return;

        const totalDays = differenceInDays(
            new Date(request.endDate.seconds * 1000),
            new Date(request.startDate.seconds * 1000)
        ) + 1;

        const formData = {
            employeeName: employee.name,
            employeeId: employee.empId || 'N/A',
            department: employee.department || 'Operations',
            position: employee.position || employee.type,
            reason: request.reason,
            startDate: format(new Date(request.startDate.seconds * 1000), 'MMMM d, yyyy'),
            endDate: format(new Date(request.endDate.seconds * 1000), 'MMMM d, yyyy'),
            dateSubmitted: format(new Date(request.submittedAt.seconds * 1000), 'MMMM d, yyyy'),
            totalDays: totalDays
        };

        // Open printable form in new window
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(generatePrintableFormHTML(formData));
        printWindow.document.close();
    };

    const generatePrintableFormHTML = (data) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>PTO Request Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .company { font-size: 14px; margin-bottom: 5px; }
        .title { font-size: 24px; font-weight: bold; margin: 10px 0; }
        .form-section { margin: 20px 0; }
        .form-row { margin: 10px 0; display: flex; align-items: center; }
        .label { font-weight: bold; width: 150px; display: inline-block; }
        .value { border-bottom: 1px solid #000; min-width: 200px; display: inline-block; padding: 2px; }
        .approval-section { margin-top: 40px; border: 1px solid #000; padding: 15px; }
        .checkbox-row { margin: 10px 0; }
        .checkbox { width: 15px; height: 15px; border: 1px solid #000; display: inline-block; margin-right: 10px; }
        .signature-line { border-bottom: 1px solid #000; width: 300px; display: inline-block; margin-left: 20px; }
        .footer { margin-top: 30px; font-size: 12px; }
        .print-buttons { text-align: center; margin: 20px 0; }
        .btn { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; margin: 0 10px; cursor: pointer; }
        .btn:hover { background-color: #0056b3; }
        .btn-secondary { background-color: #6c757d; }
        .btn-secondary:hover { background-color: #545b62; }
        @media print { .print-buttons { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">Employee Scheduling Department</div>
        <div class="title">PAID TIME OFF REQUEST FORM</div>
    </div>
    
    <div class="form-section">
        <div class="form-row">
            <span class="label">EMPLOYEE NAME:</span>
            <span class="value">${data.employeeName}</span>
        </div>
        <div class="form-row">
            <span class="label">EMPLOYEE ID:</span>
            <span class="value">${data.employeeId}</span>
        </div>
        <div class="form-row">
            <span class="label">DEPARTMENT:</span>
            <span class="value">${data.department}</span>
        </div>
        <div class="form-row">
            <span class="label">POSITION:</span>
            <span class="value">${data.position}</span>
        </div>
        <div class="form-row">
            <span class="label">REASON FOR TIME OFF:</span>
            <span class="value">${data.reason}</span>
        </div>
        <div class="form-row">
            <span class="label">START DATE:</span>
            <span class="value">${data.startDate}</span>
        </div>
        <div class="form-row">
            <span class="label">END DATE:</span>
            <span class="value">${data.endDate}</span>
        </div>
        <div class="form-row">
            <span class="label">DATE SUBMITTED:</span>
            <span class="value">${data.dateSubmitted}</span>
        </div>
        <div class="form-row">
            <span class="label">TOTAL DAYS REQUESTED:</span>
            <span class="value">${data.totalDays}</span>
        </div>
    </div>
    
    <div class="approval-section">
        <h3>MANAGER APPROVAL</h3>
        <div class="checkbox-row">
            <span class="checkbox"></span> APPROVED
        </div>
        <div class="checkbox-row">
            <span class="checkbox"></span> DENIED
        </div>
        <div class="form-row" style="margin-top: 20px;">
            <span class="label">MANAGER SIGNATURE:</span>
            <span class="signature-line"></span>
        </div>
        <div class="form-row">
            <span class="label">DATE:</span>
            <span class="signature-line"></span>
        </div>
        <div class="form-row">
            <span class="label">COMMENTS:</span>
            <span class="signature-line"></span>
        </div>
    </div>
    
    <div class="footer">
        <p>This form must be submitted at least 48 hours in advance for approval.</p>
        <p>Emergency requests may be considered with supervisor approval.</p>
    </div>
    
    <div class="print-buttons">
        <button class="btn" onclick="window.print()">Print Form</button>
        <button class="btn btn-secondary" onclick="window.close()">Close</button>
    </div>
</body>
</html>`;
    };

    const sortedRequests = [...ptoRequests].sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === "pending" ? -1 : 1;
        }
        return (a.submittedAt?.seconds || 0) - (b.submittedAt?.seconds || 0);
    });

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">Time Off Center</h2>
                    <p className="text-gray-400 mt-1">Review and manage employee PTO requests.</p>
                </div>
            </header>
            <div className="bg-gray-800 rounded-lg shadow-inner">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dates Requested</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {sortedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">No PTO requests found.</td>
                                </tr>
                            ) : (
                                sortedRequests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{getEmployeeName(req.employeeId)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {req.startDate?.seconds ? format(new Date(req.startDate.seconds * 1000), 'MMM d, yyyy') : ''} - {req.endDate?.seconds ? format(new Date(req.endDate.seconds * 1000), 'MMM d, yyyy') : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{req.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                req.status === 'approved' ? 'bg-green-900 text-green-300' :
                                                req.status === 'denied' ? 'bg-red-900 text-red-300' :
                                                'bg-yellow-900 text-yellow-300'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {req.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApprove(req)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded">Approve</button>
                                                        <button onClick={() => handleDeny(req)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Deny</button>
                                                    </>
                                                )}
                                                {req.status === 'approved' && (
                                                    <button onClick={() => handleGenerateForm(req)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">Generate Form</button>
                                                )}
                                            </div>
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
  };

  const InfoModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
                <div className="text-gray-300 mb-6">{children}</div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">OK</button>
                </div>
            </div>
        </div>
    );
  };

  const AuthConfigurationError = () => (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-red-900 border border-red-700 rounded-lg p-8 max-w-2xl w-full text-center shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-4">Action Required: Enable Anonymous Sign-In</h2>
        <p className="text-lg text-red-200 mb-6">The app failed to connect because <strong className="font-bold">Anonymous Authentication</strong> is not enabled in your Firebase project.</p>
      </div>
    </div>
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      if (user) {
        const employeesCollectionRef = collection(db, "employees");
        const ptoRequestsCollectionRef = collection(db, "pto_requests");

        const importInitialData = async () => {
            const empSnapshot = await getDocs(employeesCollectionRef);
            if (empSnapshot.empty) {
                const batch = writeBatch(db);
                initialEmployees.forEach(employee => {
                    const newDocRef = doc(employeesCollectionRef);
                    batch.set(newDocRef, employee);
                });
                await batch.commit();
            }
        };

        const unsubEmployees = onSnapshot(employeesCollectionRef, (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        });

        const unsubPtoRequests = onSnapshot(ptoRequestsCollectionRef, (snapshot) => {
            setPtoRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        importInitialData();
        return () => { unsubEmployees(); unsubPtoRequests(); };
      } else {
        signInAnonymously(auth).catch(error => { 
          if (error.code === 'auth/configuration-not-found') setAuthError(true); 
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (authError) return <AuthConfigurationError />;

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen flex font-sans antialiased">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 p-4 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">S</div>
            <h1 className="ml-3 text-xl font-bold">Scheduler</h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <XIcon />
          </button>
        </div>
        <nav className="flex-grow">
          <NavLink icon={<CalendarIcon />} isActive={activePage === 'Dashboard'} onClick={() => setActivePage('Dashboard')}>Dashboard</NavLink>
          <NavLink icon={<UsersIcon />} isActive={activePage === 'Team Management'} onClick={() => setActivePage('Team Management')}>Team Management</NavLink>
          <NavLink icon={<DocumentIcon />} isActive={activePage === 'Submit PTO Request'} onClick={() => setActivePage('Submit PTO Request')}>Submit PTO Request</NavLink>
          <NavLink icon={<ClockIcon />} isActive={activePage === 'PTO History'} onClick={() => setActivePage('PTO History')}>PTO History</NavLink>
          <NavLink icon={<CalendarIcon />} isActive={activePage === 'PTO Calendar'} onClick={() => setActivePage('PTO Calendar')}>PTO Calendar</NavLink>
          <NavLink icon={<ChartIcon />} isActive={activePage === 'Admin Reports'} onClick={() => setActivePage('Admin Reports')}>Admin Reports</NavLink>
          <NavLink icon={<ClockIcon />} isActive={activePage === 'Time Off Center'} onClick={() => setActivePage('Time Off Center')}>Time Off Center</NavLink>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700">
          <p className="px-4 text-xs text-gray-500">Version 2.0.0 (Enhanced PTO System)</p>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <MenuIcon />
          </button>
          <h2 className="text-lg font-semibold text-white">{activePage}</h2>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        <main className="p-4 lg:p-6 xl:p-8 overflow-y-auto min-h-screen">
          {activePage === 'Submit PTO Request' && (
            <div>
              {/* Employee Selection for PTO Request */}
              <div className="mb-6">
                <label htmlFor="currentEmployee" className="block text-sm font-medium text-gray-300 mb-2">
                  Select Employee for PTO Request
                </label>
                <select
                  id="currentEmployee"
                  value={currentEmployeeId}
                  onChange={(e) => setCurrentEmployeeId(e.target.value)}
                  className="w-full max-w-xs bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select an employee...</option>
                  {employees.filter(emp => !emp.name.includes('OPEN') && emp.type !== 'Bank').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <EmployeePTORequestForm 
                employees={employees} 
                ptoRequests={ptoRequests}
                setInfoModal={setInfoModal} 
              />
            </div>
          )}
          {activePage === 'PTO History' && (
            <div>
              {/* Employee Selection for PTO History */}
              <div className="mb-6">
                <label htmlFor="historyEmployee" className="block text-sm font-medium text-gray-300 mb-2">
                  Select Employee to View History
                </label>
                <select
                  id="historyEmployee"
                  value={currentEmployeeId}
                  onChange={(e) => setCurrentEmployeeId(e.target.value)}
                  className="w-full max-w-xs bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select an employee...</option>
                  {employees.filter(emp => !emp.name.includes('OPEN') && emp.type !== 'Bank').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <EmployeePTOHistoryPage 
                employees={employees} 
                ptoRequests={ptoRequests}
                currentEmployeeId={currentEmployeeId}
                setInfoModal={setInfoModal} 
              />
            </div>
          )}
          {activePage === 'PTO Calendar' && (
            <PTOCalendarPage 
              employees={employees} 
              ptoRequests={ptoRequests}
            />
          )}
          {activePage === 'Admin Reports' && (
            <AdminReportingPage 
              employees={employees} 
              ptoRequests={ptoRequests}
              setInfoModal={setInfoModal} 
            />
          )}
          {activePage === 'Time Off Center' && <TimeOffCenterPage ptoRequests={ptoRequests} employees={employees} setInfoModal={setInfoModal} />}
          {(activePage === 'Dashboard' || activePage === 'Team Management') && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white mb-4">Feature Coming Soon</h2>
              <p className="text-gray-400">This feature is currently being developed.</p>
            </div>
          )}
        </main>
      </div>
      {infoModal && <InfoModal isOpen={!!infoModal} onClose={() => setInfoModal(null)} title={infoModal.title}>{infoModal.message}</InfoModal>}
    </div>
  );
}