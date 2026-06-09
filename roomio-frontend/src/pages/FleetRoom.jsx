import { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Flex, Text, IconButton, Spinner } from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRoom, useRooms } from "../hooks/useRooms";
import { RoomStatusCard } from "../components/room/RoomStatusCard";
import { ReservationList } from "../components/room/ReservationList";
import { RoomInfoPanel } from "../components/room/RoomInfoPanel";
import { BookingForm } from "../components/booking/BookingForm";
import { BookingButton } from "../components/booking/BookingButton";
import { FilterBar } from "../components/ui/FilterBar";
import { FloorPlan } from "../components/floorplan/FloorPlan";
import { SETTINGS } from "../config/settings";

export default function FleetRoom() {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const { room, loading, error } = useRoom(roomName);
  const { rooms } = useRooms();

  const [view, setView] = useState("room");
  const [selectedRoomName, setSelectedRoomName] = useState(roomName);
  const [bookingKey, setBookingKey] = useState(0);
  const [filters, setFilters] = useState({ capacity: 0, tv: false, whiteboard: false, computer: false });

  // Reset selected room when current room changes
  useEffect(() => {
    setSelectedRoomName(roomName);
  }, [roomName]);

  // Inactivity timer
  useEffect(() => {
    let timer = setTimeout(() => {
      navigate(`/fleet/${encodeURIComponent(roomName)}`, { replace: true });
    }, SETTINGS.INACTIVITY_TIMEOUT * 60 * 1000);

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        navigate(`/fleet/${encodeURIComponent(roomName)}`, { replace: true });
      }, SETTINGS.INACTIVITY_TIMEOUT * 60 * 1000);
    }

    window.addEventListener("click", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [navigate, roomName]);

  const selectedRoomData = useMemo(() => {
    if (!selectedRoomName || !rooms.length) return room;
    return rooms.find((r) => r.name === selectedRoomName) || room;
  }, [selectedRoomName, rooms, room]);

  const filteredRoomNames = useMemo(() => {
    const activeEq = Object.entries(filters).filter(([k, v]) => k !== "capacity" && v).map(([k]) => k);
    return rooms
      .filter((r) => {
        if (filters.capacity && (r.elements.capacity || 0) < filters.capacity) return false;
        for (const eq of activeEq) {
          if (!r.elements[eq]) return false;
        }
        return true;
      })
      .map((r) => r.name);
  }, [rooms, filters]);

  function handleBookingSuccess() {
    setBookingKey((k) => k + 1);
    goToRoom();
  }

  function goToBooking() {
    setView("booking");
    setSelectedRoomName(roomName);
  }

  function goToRoom() {
    setView("room");
    setSelectedRoomName(roomName);
  }

  if (loading) {
    return (
      <Box minH="100vh" bg="#0a0a0b" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="accent.default" thickness="4px" />
      </Box>
    );
  }

  if (error || !room) {
    return (
      <Box minH="100vh" bg="#0a0a0b" display="flex" alignItems="center" justifyContent="center" flexDir="column" gap={4}>
        <Text color="text.muted">Salle introuvable</Text>
        <Text as="button" fontSize="sm" color="accent.default" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Text>
      </Box>
    );
  }

  // === ROOM VIEW (default) ===
  if (view === "room") {
    return (
      <Box h="100vh" w="100vw" overflow="hidden" bg="#0a0a0b" position="relative">
        <Flex h="100%" w="100%">
          {/* Left 50%: Room status card */}
          <Box w="50%" h="100%" p={6} display="flex" flexDirection="column">
            <Box w="100%" maxW="500px" flex={1} display="flex" flexDirection="column">
              <RoomStatusCard room={room} onBook={goToBooking} activateReservationButton={false} />
            </Box>
          </Box>

          {/* Right 50%: Reservation list */}
          <Box w="50%" h="100%" p={6} display="flex" flexDirection="column">
            <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={4}>
              Réservations du jour
            </Text>
            <Box flex={1} bg="bg.secondary" borderRadius="xl" overflow="hidden">
              <ReservationList
                reservations={room?.reservations || []}
                onDelete={(uid) => console.log("Delete:", uid)}
              />
            </Box>
          </Box>
        </Flex>

        {/* Bottom-right booking button */}
        <Box position="absolute" bottom={8} right={8} zIndex={10}>
          <BookingButton variant="plus" onClick={goToBooking} ariaLabel="Réserver une salle" />
        </Box>
      </Box>
    );
  }

  // === BOOKING FLOW ===
  const currentRoom = selectedRoomData || room;

  return (
    <Box h="100vh" w="100vw" overflow="hidden" bg="#0a0a0b" position="relative">
      <Flex h="100%" w="100%">
        {/* Left 35%: filters + info + form */}
        <Box w="35%" h="100%" p={6} display="flex" flexDirection="column" gap={4} overflow="hidden">
          {/* Back button */}
          <Flex align="center" gap={2}>
            <IconButton
              aria-label="Retour"
              size="xs"
              variant="ghost"
              color="text.muted"
              _hover={{ color: "text.primary" }}
              onClick={goToRoom}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <Text fontSize="sm" color="text.secondary">Retour</Text>
          </Flex>

          <FilterBar onChange={setFilters} />

          <Box bg="bg.secondary" borderRadius="lg" p={4}>
            <RoomInfoPanel room={currentRoom} />
          </Box>

          <Box flex={1} overflowY="auto">
            <BookingForm
              key={bookingKey}
              roomName={currentRoom.name}
              existingReservations={currentRoom.reservations || []}
              onSuccess={handleBookingSuccess}
              onCancel={goToRoom}
            />
          </Box>
        </Box>

        {/* Right 65%: Floor plan */}
        <Box w="65%" h="100%" position="relative">
          <FloorPlan
            rooms={rooms}
            selectedRoom={currentRoom.name}
            dimmedRooms={filteredRoomNames}
            onRoomClick={(name) => setSelectedRoomName(name)}
          />
        </Box>
      </Flex>
    </Box>
  );
}
