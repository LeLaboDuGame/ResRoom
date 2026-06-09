import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import FleetRoom from "./pages/FleetRoom";
import Admin from "./pages/Admin";
import Debug from "./pages/Debug";

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
