# Rural Telemedicine Portal

A comprehensive full-stack web application designed to provide telemedicine services to rural areas, featuring role-based authentication, video consultations, health records management, pharmacy inventory, emergency services, and AI-assisted symptom analysis.

## 🏥 Features

### Core Functionality
- **Role-based Authentication**: Admin, Doctor, Patient, and Government Official roles
- **Video Consultations**: Queue-based consultation system with video call placeholders
- **Health Records**: Offline-capable medical records with search and filtering
- **Pharmacy Management**: Real-time inventory tracking with stock alerts
- **Emergency Services**: Emergency alert system with doctor assignment
- **Advanced AI Symptom Analysis**: AI-powered analysis providing risk assessment, potential conditions, actionable recommendations, and insights from similar patient cases.
- **Government Analytics**: Population health insights and outbreak tracking

### Technical Features
- **Offline Support**: IndexedDB caching for critical data
- **Responsive Design**: Mobile-first UI design
- **Real-time Updates**: Live status updates for queues and emergencies
- **Data Analytics**: Comprehensive dashboards and reporting
- **Security**: JWT-based authentication with role-based access control

## 🛠 Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migrations
- **JWT**: Authentication tokens
- **Passlib**: Password hashing
- **Scikit-learn**: AI/ML features (placeholder)

### Frontend
- **React**: User interface framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Dexie**: IndexedDB wrapper for offline support
- **LocalForage**: Offline storage utilities

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 14+**
- **PostgreSQL 12+**
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd rural-telemedicine-portal
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/rural_telemedicine
SECRET_KEY=your-secret-key-here-make-it-long-and-secure
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Database Setup

1. **Create PostgreSQL Database**:
```sql
CREATE DATABASE rural_telemedicine;
```

2. **Run Database Migrations** (if using Alembic):
```bash
alembic upgrade head
```

3. **Seed Sample Data**:
```bash
python seed_data.py
```

#### Start Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
```

#### Environment Configuration

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

#### Start Frontend Development Server

```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 👥 Sample Login Credentials

After running the seed script, you can use these credentials:

### Admin
- **Email**: `admin@ruralhealth.gov.in`
- **Password**: `admin123`

### Government Official
- **Email**: `rajesh.kumar@health.gov.in`
- **Password**: `gov123`

### Doctor (Example)
- **Email**: `priya.sharma@hospital.com`
- **Password**: `doctor123`

### Patient (Example)
- **Email**: `ramesh.kumar@email.com`
- **Password**: `patient123`

*Note: All doctor accounts use password `doctor123` and all patient accounts use `patient123`*

## 📱 User Roles & Permissions

### 👨‍⚕️ Doctor
- View and manage consultation queue
- Access patient medical records
- Update availability status
- Handle emergency assignments
- View patient analytics

### 👤 Patient
- Join consultation queues
- View personal health records
- Use AI symptom checker
- Access pharmacy information
- Create emergency alerts

### 👨‍💼 Admin
- Manage all users and data
- Monitor system analytics
- Manage pharmacy inventory
- Oversee emergency responses
- System configuration

### 🏛️ Government Official
- View population health analytics
- Monitor outbreak alerts
- Access demographic reports
- Review emergency statistics
- Generate health reports

## 🗂 Project Structure

```
rural-telemedicine-portal/
├── backend/
│   ├── routes/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── doctors.py       # Doctor management
│   │   ├── patients.py      # Patient management
│   │   ├── pharmacy.py      # Medicine inventory
│   │   ├── records.py       # Health records
│   │   ├── queues.py        # Consultation queues
│   │   ├── emergency.py     # Emergency services
│   │   ├── ai.py            # Original AI features
│   │   └── ai_routes.py     # Advanced AI Symptom Checker
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── utils.py            # Utility functions
│   ├── ai_patient_db.py    # AI Patient Database simulation
│   ├── main.py             # FastAPI application
│   ├── seed_data.py        # Database seeding
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # CSS styles
│   │   └── App.js          # Main application
│   └── package.json        # Node dependencies
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Doctors
- `GET /doctors` - List doctors
- `POST /doctors` - Create doctor
- `PUT /doctors/{id}/availability` - Toggle availability
- `GET /doctors/analytics/workload` - Doctor analytics

### Patients
- `GET /patients` - List patients
- `POST /patients` - Create patient
- `GET /patients/analytics/demographics` - Patient analytics

### Pharmacy
- `GET /pharmacy` - List medicines
- `POST /pharmacy` - Add medicine
- `PUT /pharmacy/{id}/stock` - Update stock
- `GET /pharmacy/analytics/inventory` - Inventory analytics

### Health Records
- `GET /records` - List records
- `POST /records` - Create record
- `GET /records/analytics/trends` - Health trends

### Consultation Queue
- `GET /queues` - List queue entries
- `POST /queues/join` - Join queue
- `PUT /queues/{id}/status` - Update queue status

### Emergency
- `GET /emergency/doctors` - Emergency doctors
- `POST /emergency/alerts` - Create alert
- `GET /emergency/analytics/response-times` - Emergency analytics

### AI Features
- `POST /ai-symptom-checker/analyze` - Advanced symptom analysis with patient context.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Endpoint protection by user role
- **Password Hashing**: Bcrypt password encryption
- **CORS Configuration**: Cross-origin request handling
- **Input Validation**: Pydantic schema validation

## 📱 Offline Support

The application includes comprehensive offline support:

- **Health Records Caching**: Medical records stored locally
- **Medicine Inventory**: Pharmacy data cached for offline access
- **Consultation Queue**: Queue status cached locally
- **Auto-sync**: Automatic synchronization when connection restored
- **Offline Indicators**: Visual feedback for offline status

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Role-based Navigation**: Dynamic navigation based on user role
- **Status Indicators**: Visual feedback for system status
- **Loading States**: Smooth loading experiences
- **Error Handling**: User-friendly error messages
- **Accessibility**: ARIA labels and keyboard navigation

## 🚨 Emergency Features

- **Emergency Doctor Tracking**: Real-time doctor availability
- **Alert Management**: Create and manage emergency alerts
- **Nearest Doctor Search**: Location-based doctor assignment
- **Response Time Analytics**: Emergency response monitoring
- **Government Hospital Integration**: Escalation to higher facilities

## 📊 Analytics & Reporting

### Doctor Analytics
- Consultation statistics by specialization
- Workload distribution
- Availability patterns
- Emergency response metrics

### Patient Analytics
- Demographic distribution
- Village-wise patient counts
- Age and gender analytics
- Health trend analysis

### Pharmacy Analytics
- Inventory levels and alerts
- Medicine demand patterns
- Supplier performance
- Outbreak impact on stock

### Emergency Analytics
- Response time analysis
- Alert type distribution
- Doctor assignment efficiency
- Geographic incident patterns

## 🔮 Future Enhancements

### Planned Features
- **Real Video Integration**: WebRTC or third-party video solutions
- **Advanced AI Models**: Machine learning for symptom analysis
- **Mobile Applications**: Native iOS and Android apps
- **SMS Integration**: SMS notifications for rural areas
- **Multilingual Support**: Local language interfaces
- **Telemedicine Devices**: Integration with medical devices
- **Blockchain Records**: Secure health record management

### Technical Improvements
- **Microservices Architecture**: Service decomposition
- **Container Deployment**: Docker and Kubernetes
- **CI/CD Pipeline**: Automated testing and deployment
- **Performance Monitoring**: Application performance tracking
- **Advanced Caching**: Redis for improved performance
- **Real-time Features**: WebSocket for live updates

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **Import Errors**:
   - Verify all dependencies installed: `pip install -r requirements.txt`
   - Check Python version (3.8+ required)

3. **Authentication Issues**:
   - Verify SECRET_KEY in .env file
   - Check token expiration settings

#### Frontend Issues
1. **API Connection Error**:
   - Verify backend server is running
   - Check REACT_APP_API_URL in .env file
   - Check CORS settings in backend

2. **Build Errors**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version (14+ required)

3. **Offline Features Not Working**:
   - Check browser IndexedDB support
   - Verify Dexie initialization
   - Check network status detection

### Development Tips

1. **Database Reset**:
```bash
# Drop and recreate database
dropdb rural_telemedicine
createdb rural_tele telemedicine
python seed_data.py
```

2. **Clear Browser Storage**:
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Clear IndexedDB through browser dev tools
```

3. **API Testing**:
   - Use FastAPI automatic docs at `http://localhost:8000/docs`
   - Test endpoints with Postman or curl

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📞 Support

For support and questions:
- **Email**: support@ruraltelemedicine.com
- **Emergency Helpline**: 108
- **Technical Issues**: Create an issue on GitHub

## 🙏 Acknowledgments

- Healthcare workers in rural areas
- Open source community
- Government health initiatives
- Technology partners

---

**Built with ❤️ for rural healthcare accessibility**
#   r u r a l - t e l e m e d i c i n e  
 