import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FleetRoom from "./pages/FleetRoom";
import Admin from "./pages/Admin";
import Debug from "./pages/Debug";

/**
 * Root application component.
 *
 * Defines the route structure:
 * - `/` renders the Dashboard
 * - `/debug` renders the Debug page
 * - `/fleet/:roomName` renders the FleetRoom page for a specific room
 * - `/admin` renders the Admin page
 *
 * @returns {JSX.Element} A Routes element wrapping all application pages
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/debug" element={<Debug />} />
      <Route path="/fleet/:roomName" element={<FleetRoom />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
