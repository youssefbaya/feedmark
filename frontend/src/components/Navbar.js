import { NavLink } from 'react-router-dom';
import logo from '../assets/Logo_Feedmark.png';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">
          <img src={logo} alt="FeedMark" className="navbar-logo" />
        </NavLink>
      </div>

      <ul className="navbar-links">
        <li><NavLink to="/">Dashboard</NavLink></li>
        <li><NavLink to="/assignments">Assignments</NavLink></li>
        <li><NavLink to="/create">Create</NavLink></li>
        <li><NavLink to="/students">Students</NavLink></li>
        <li><NavLink to="/feedback">Feedback</NavLink></li>
      </ul>
    </nav>
  );
}

export default Navbar;