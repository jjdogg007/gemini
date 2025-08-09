# Employee Scheduler - Enhanced PTO System

A comprehensive employee scheduling and time-off management system built with React and Firebase.

## Features

### 🏢 Core System
- **Employee Management**: Manage employee profiles with departments, positions, and availability
- **Shift Scheduling**: Template-based shift assignments with hours tracking
- **Firebase Integration**: Real-time data synchronization with Firestore

### 📋 PTO Management System

#### 1. **Employee PTO Request Submission**
- Submit time-off requests with reason, start/end dates
- Real-time PTO balance validation
- Visual balance display showing total, used, pending, and available days
- Automatic request days calculation
- Form validation with error handling

#### 2. **Employee PTO Request History**
- View complete history of all PTO requests
- Filter by status (pending, approved, denied)
- Current year summary with days used
- Status-based color coding
- Edit/cancel pending requests with inline editing

#### 3. **Manager Time Off Center**
- Review all employee PTO requests
- Approve/deny requests with single-click actions
- Generate printable PTO forms for approved requests
- Sorted by status priority (pending first)

#### 4. **PTO Calendar View**
- Monthly calendar displaying approved time-off
- Visual indicators for multiple employees per day
- Navigate between months
- Current month summary of all approved requests
- Hover tooltips showing employee details

#### 5. **Admin Reporting & Analytics**
- Advanced filtering by department, employee, status, and date range
- Real-time statistics dashboard
- CSV export functionality for reports
- Visual metrics including total requests, approval rates, and days used

#### 6. **Request Management**
- **Edit Requests**: Modify pending requests inline
- **Cancel Requests**: Remove unwanted pending requests
- **Status Tracking**: Real-time status updates
- **Balance Validation**: Prevent over-allocation of PTO days

### 🎨 Mobile-Responsive Design
- **Responsive Sidebar**: Collapsible navigation for mobile devices
- **Touch-Friendly Interface**: Optimized buttons and inputs for touch screens
- **Mobile-First Components**: Responsive tables with horizontal scrolling
- **Adaptive Layouts**: Grid layouts that stack on smaller screens

### 🔧 Technical Features
- **Real-time Updates**: Firebase Firestore live synchronization
- **Anonymous Authentication**: Simplified access without user accounts
- **Date Handling**: Advanced date calculations using date-fns
- **Error Handling**: Comprehensive validation and error messages
- **Modern UI**: Tailwind CSS with dark theme

## Installation & Setup

### Prerequisites
- Node.js (version 16 or higher)
- Firebase account with project setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd gemini
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
The app includes a pre-configured Firebase project. For production use:

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Anonymous Authentication
4. Update the Firebase configuration in `src/App.jsx`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Usage Guide

### For Employees

#### Submitting PTO Requests
1. Navigate to **"Submit PTO Request"**
2. Select your employee profile
3. View your current PTO balance
4. Fill in request details:
   - Reason for time off
   - Start and end dates
5. Submit request (balance validation prevents over-allocation)

#### Viewing Request History
1. Go to **"PTO History"**
2. Select your employee profile
3. View all past and current requests
4. Edit or cancel pending requests as needed

### For Managers

#### Managing Requests
1. Access **"Time Off Center"**
2. Review pending requests (shown first)
3. Approve or deny requests with single clicks
4. Generate printable forms for approved requests

#### Calendar Overview
1. Visit **"PTO Calendar"**
2. Navigate months to see approved time-off
3. View monthly summaries of all requests

### For Administrators

#### Generating Reports
1. Open **"Admin Reports"**
2. Apply filters as needed:
   - Department
   - Employee
   - Status
   - Date range
3. View real-time statistics
4. Export data to CSV for external analysis

## Data Structure

### Employee Records
```javascript
{
  name: 'Last, First',
  type: 'FT' | 'PT',
  department: 'Operations',
  position: 'Full Time',
  empId: 'EMP001',
  hire_date: '2023-01-01',
  shifts: '7a-3p',
  availability: 'Mon,Tue,Wed,Thu,Fri',
  max_days: 5,
  target_hours: 160
}
```

### PTO Request Records
```javascript
{
  employeeId: 'firebase-doc-id',
  reason: 'Vacation',
  startDate: Timestamp,
  endDate: Timestamp,
  submittedAt: Timestamp,
  status: 'pending' | 'approved' | 'denied'
}
```

## PTO Balance Calculation

The system automatically calculates PTO balances based on:
- **Full-time employees**: 20 days per year
- **Part-time employees**: 10 days per year
- **Used PTO**: Sum of approved request days
- **Pending PTO**: Sum of pending request days
- **Available PTO**: Total - Used - Pending

## Mobile Responsiveness

The application is fully responsive with:
- Collapsible sidebar for mobile navigation
- Responsive tables with horizontal scrolling
- Touch-optimized buttons and forms
- Adaptive grid layouts
- Mobile-first CSS approach

## Security & Access Control

Current implementation uses Firebase anonymous authentication. For production:

1. **Implement proper user authentication**
2. **Add role-based access control**:
   - Employees: Submit and edit own requests
   - Managers: Approve/deny requests
   - Admins: Full system access
3. **Secure Firestore rules** based on user roles

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Version History

- **v2.0.0**: Enhanced PTO System
  - Employee PTO request history
  - PTO balance integration
  - Request editing/cancellation
  - Calendar integration
  - Admin reporting & CSV export
  - Mobile-responsive design
  
- **v1.6.0**: Time Off Center
  - Basic PTO request submission
  - Manager approval interface
  - Printable forms

## Future Enhancements

- **Email Notifications**: Automated notifications for request workflow
- **Google Calendar Integration**: Sync approved requests with external calendars
- **Role-Based Authentication**: Proper user management system
- **Advanced Reporting**: More detailed analytics and insights
- **Bulk Operations**: Batch approve/deny multiple requests
- **Mobile App**: Native mobile application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify Firebase configuration
3. Ensure all dependencies are installed
4. Check network connectivity for Firebase operations

## License

This project is licensed under the ISC License.