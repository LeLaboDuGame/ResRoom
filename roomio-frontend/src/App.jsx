import { Routes, Route } from "react-router-dom";
import RoomsList from "./pages/RoomsList";
import RoomPage from "./pages/RoomPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoomsList />} />
      <Route path="/rooms/:roomName" element={<RoomPage />} />
    </Routes>
  );
}