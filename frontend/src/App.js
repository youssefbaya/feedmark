import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AssignmentProvider } from './context/AssignmentContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import AssignmentDetails from './pages/AssignmentDetails';
import CreateAssignment from './pages/CreateAssignment';
import FeedbackLibrary from './pages/FeedbackLibrary';
import MarkStudent from './pages/MarkStudent';
import MarkedStudents from './pages/MarkedStudents';
import StudentsOverview from './pages/StudentsOverview';
import { Toaster } from 'react-hot-toast';


import './App.css';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/mark/:id" element={<MarkStudent />} />
        <Route path="/mark/:id/edit/:studentRecordId" element={<MarkStudent />} />
        <Route path="/assignments/:id" element={<AssignmentDetails />} />
        <Route path="/create" element={<CreateAssignment />} />
        <Route path="/feedback" element={<FeedbackLibrary />} />
        <Route path="/marked/:id" element={<MarkedStudents />} />
        <Route path="/students" element={<StudentsOverview />} />
        <Route
          path="/edit-assignment/:id"
          element={<CreateAssignment editMode />}
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <FeedbackProvider>
      <AssignmentProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '14px',
                  background: '#fff',
                  color: '#1f2937',
                  border: '1px solid #ececec',
                  padding: '14px 16px',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.08)'
                },
                success: {
                  iconTheme: {
                    primary: '#27ae60',
                    secondary: '#fff'
                  }
                }
              }}
            />
            <Navbar />
            <main className="App-main">
              <AnimatedRoutes />
            </main>
          </div>
        </Router>
      </AssignmentProvider>
    </FeedbackProvider>
  );
}

export default App;