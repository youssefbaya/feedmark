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

import './App.css';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/mark/:id" element={<MarkStudent />} />
        <Route path="/assignments/:id" element={<AssignmentDetails />} />
        <Route path="/create" element={<CreateAssignment />} />
        <Route path="/feedback" element={<FeedbackLibrary />} />
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