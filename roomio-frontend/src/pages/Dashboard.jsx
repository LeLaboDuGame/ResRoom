import { useState, useMemo } from "react";
import { Box, Flex, Text, IconButton } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useRooms } from "../hooks/useRooms";
import { FloorPlan } from "../components/floorplan/FloorPlan";
import { RoomInfoPanel } from "../components/room/RoomInfoPanel";
import { Calendar } from "../components/room/Calendar.jsx";
import { BookingForm } from "../components/booking/BookingForm";
import { AppShell } from "../components/layout/AppShell";
import { X, LayoutDashboard, Settings } from "lucide-react";

/**
 * Main dashboard page at route "/".
 * Displays an interactive floor plan, a side panel with room info,
 * daily reservations, and a booking form when a room is selected.
 * Includes a mobile bottom tab bar for navigation.
 * @returns {JSX.Element} The dashboard layout
 */
export default function Dashboard() {
  const { rooms, loading: roomsLoading } = useRooms();
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const [bookingKey, setBookingKey] = useState(0);
  const [mobileTab, setMobileTab] = useState("plan");

  const selectedRoom = useMemo(() => {
    if (!selectedRoomName || !rooms.length) return null;
    return rooms.find((r) => r.name === selectedRoomName) || null;
  }, [selectedRoomName, rooms]);

  function handleRoomClick(name) {
    setSelectedRoomName(name === selectedRoomName ? null : name);
  }

  function handleBookingSuccess() {
    setBookingKey((k) => k + 1);
  }

  const panelOpen = !!selectedRoomName;

  return (
    <AppShell>
      <Box h="100%" position="relative">
        {/* Floor plan */}
        <Box
          h="100%"
          w={panelOpen ? { md: "calc(100% - 420px)", base: "100%" } : "100%"}
          transition="width 0.25s ease"
          position="relative"
        >
          {roomsLoading ? (
            <Flex h="100%" align="center" justify="center">
              <Text color="text.muted">Loading plan…</Text>
            </Flex>
          ) : (
            <FloorPlan
              rooms={rooms}
              selectedRoom={selectedRoomName}
              onRoomClick={handleRoomClick}
            />
          )}
        </Box>

        {/* Panel: desktop right, mobile full top */}
        <Box
          position="absolute"
          top={0}
          right={0}
          h="100%"
          w={{ base: "100%", md: "420px" }}
          bg="bg.elevated"
          borderLeft={{ md: "1px solid" }}
          borderColor="border.default"
          transform={panelOpen ? "translateX(0)" : "translateX(100%)"}
          transition="transform 0.25s ease"
          zIndex={20}
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": { bg: "#2c2c30", borderRadius: "full" },
          }}
        >
          {selectedRoom && (
            <Box>
              <Flex align="center" justify="space-between" px={{ base: 4, md: 5 }} py={{ base: 3, md: 4 }} borderBottom="1px solid" borderColor="border.default">
                <RoomInfoPanel room={selectedRoom} />
                <IconButton
                  aria-label="Close panel"
                  size="xs"
                  variant="ghost"
                  color="text.muted"
                  _hover={{ color: "text.primary" }}
                  onClick={() => setSelectedRoomName(null)}
                >
                  <X size={18} />
                </IconButton>
              </Flex>
              <Text fontSize="xs" fontWeight="medium" color="text.muted" px={{ base: 4, md: 5 }} pt={4} textTransform="uppercase" letterSpacing="wide">
                Réservations du jour
              </Text>
              <Box px={{ base: 4, md: 5 }} py={3}>
                <Calendar
                  reservations={selectedRoom.reservations || []}
                  onDelete={(uid) => console.log("Delete:", uid)}
                />
              </Box>
              <Box px={{ base: 4, md: 5 }} py={4} borderTop="1px solid" borderColor="border.default" mt={2}>
                <BookingForm
                  key={bookingKey}
                  roomName={selectedRoom.name}
                  existingReservations={selectedRoom.reservations || []}
                  onSuccess={handleBookingSuccess}
                  onCancel={() => {}}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* Backdrop for panel (desktop only — mobile panel is fullscreen) */}
        {panelOpen && (
          <Box
            position="absolute"
            inset={0}
            bg="rgba(0,0,0,0.3)"
            zIndex={15}
            display={{ base: "none", md: "block" }}
            onClick={() => setSelectedRoomName(null)}
          />
        )}

        {/* Bottom tabs (mobile) */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          zIndex={5}
          display={{ base: "flex", md: "none" }}
          bg="rgba(28,28,31,0.95)"
          borderTop="1px solid"
          borderColor="border.default"
        >
          <Flex
            as="button"
            flex={1}
            direction="column"
            align="center"
            gap={0.5}
            py={2.5}
            color={mobileTab === "plan" ? "accent.default" : "text.muted"}
            onClick={() => setMobileTab("plan")}
          >
            <LayoutDashboard size={20} />
            <Text fontSize="xs">Plan</Text>
          </Flex>
          <Flex
            as={Link}
            to="/admin"
            flex={1}
            direction="column"
            align="center"
            gap={0.5}
            py={2.5}
            color="text.muted"
            _hover={{ color: "text.primary" }}
          >
            <Settings size={20} />
            <Text fontSize="xs">Admin</Text>
          </Flex>
        </Box>
      </Box>
    </AppShell>
  );
}
