import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FleetRoom from "./pages/FleetRoom";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/fleet/:roomName" element={<FleetRoom />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
