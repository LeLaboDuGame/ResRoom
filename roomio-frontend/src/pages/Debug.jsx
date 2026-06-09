import { useState, useEffect } from "react";
import { Box, Flex, Text, Button, Input, Tabs } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import * as api from "../api/rooms";
import { Clock } from "../components/ui/Clock";
import { StatusBadge } from "../components/ui/StatusBadge";
import { FilterBar } from "../components/ui/FilterBar";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { MeetingProgress } from "../components/room/MeetingProgress";
import { ReservationList } from "../components/room/ReservationList";
import { RoomInfoPanel } from "../components/room/RoomInfoPanel";
import { RoomStatusCard } from "../components/room/RoomStatusCard";
import { FloorPlan } from "../components/floorplan/FloorPlan";
import { usePlan } from "../hooks/usePlan";

function Section({ title, children }) {
  return (
    <Box mb={6}>
      <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={3} pb={1} borderBottom="1px solid" borderColor="border.default">
        {title}
      </Text>
      {children}
    </Box>
  );
}

function ApiButton({ label, action, onResult }) {
  const [loading, setLoading] = useState(false);
  return (
    <Button
      size="sm"
      bg="bg.elevated"
      color="text.primary"
      border="1px solid"
      borderColor="border.default"
      _hover={{ bg: "border.default" }}
      isLoading={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const data = await action();
          onResult(data);
        } catch (e) {
          onResult({ error: e.message });
        }
        setLoading(false);
      }}
    >
      {label}
    </Button>
  );
}

export default function Debug() {
  const { background, walls, roomPolygons } = usePlan();
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState("ui");

  // API result states
  const [fetchRoomsRes, setFetchRoomsRes] = useState(null);
  const [fetchRoomRes, setFetchRoomRes] = useState(null);
  const [createResRes, setCreateResRes] = useState(null);
  const [deleteResRes, setDeleteResRes] = useState(null);
  const [updateRoomRes, setUpdateRoomRes] = useState(null);
  const [uploadPhotoRes, setUploadPhotoRes] = useState(null);
  const [fetchHistoryRes, setFetchHistoryRes] = useState(null);
  const [fetchSettingsRes, setFetchSettingsRes] = useState(null);
  const [updateSettingsRes, setUpdateSettingsRes] = useState(null);
  const [roomNameInput, setRoomNameInput] = useState("Howard Hughes");

  const sampleRoom = {
    name: "Howard Hughes",
    elements: { capacity: 6, tv: true, whiteboard: true, computer: false },
    reservations: [
      { uid: "1", title: "Stand-up", start: "2026-06-05 09:00", end: "2026-06-05 09:30", reserved_by: "Alice" },
      { uid: "2", title: "Sprint Review", start: "2026-06-05 14:00", end: "2026-06-05 15:00", reserved_by: "Bob" },
    ],
  };

  useEffect(() => {
    api.fetchRooms().then(d => { setRooms(d.rooms || []); setFetchRoomsRes(d); }).catch(() => {});
  }, []);

  const JsonBox = ({ data }) => (
    <Box
      as="pre"
      fontSize="xs"
      mt={2}
      p={2}
      bg="#0a0a0b"
      borderRadius="md"
      maxH="200px"
      overflow="auto"
      color="text.secondary"
      css={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { bg: "#2c2c30", borderRadius: "full" } }}
    >
      {JSON.stringify(data, null, 2)}
    </Box>
  );

  return (
    <Box minH="100vh" bg="#0a0a0b" color="text.primary" p={6}>
      {/* Nav */}
      <Flex gap={4} mb={6} wrap="wrap">
        <Text as={Link} to="/debug" fontWeight="bold" color="accent.default" fontSize="lg">Debug</Text>
        <Text as={Link} to="/" color="text.secondary" _hover={{ color: "text.primary" }}>Dashboard</Text>
        <Text as={Link} to="/fleet/Howard%20Hughes" color="text.secondary" _hover={{ color: "text.primary" }}>FleetRoom</Text>
        <Text as={Link} to="/admin" color="text.secondary" _hover={{ color: "text.primary" }}>Admin</Text>
      </Flex>

      {/* Tabs */}
      <Flex gap={1} mb={6}>
        {["ui", "api", "floorplan"].map(tab => (
          <Box
            key={tab}
            as="button"
            px={4}
            py={2}
            borderRadius="md"
            fontSize="sm"
            fontWeight="medium"
            bg={activeTab === tab ? "accent.default" : "bg.elevated"}
            color={activeTab === tab ? "white" : "text.secondary"}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "ui" ? "UI Components" : tab === "api" ? "API Tests" : "Floor Plan"}
          </Box>
        ))}
      </Flex>

      {/* === UI COMPONENTS TAB === */}
      {activeTab === "ui" && (
        <Box>
          <Section title="Clock">
            <Clock />
          </Section>

          <Section title="StatusBadge">
            <Flex gap={3} wrap="wrap">
              <StatusBadge status="free" />
              <StatusBadge status="startingSoon" />
              <StatusBadge status="meeting" />
              <StatusBadge status="finishingSoon" />
            </Flex>
          </Section>

          <Section title="FilterBar">
            <FilterBar onChange={(f) => console.log("FilterBar:", f)} />
          </Section>

          <Section title="LoadingSkeleton">
            <Flex gap={4} align="end" wrap="wrap">
              <Box>
                <Text fontSize="xs" color="text.muted" mb={1}>variant="card"</Text>
                <LoadingSkeleton variant="card" w="200px" />
              </Box>
              <Box>
                <Text fontSize="xs" color="text.muted" mb={1}>variant="text"</Text>
                <LoadingSkeleton variant="text" w="150px" />
              </Box>
              <Box>
                <Text fontSize="xs" color="text.muted" mb={1}>variant="circle"</Text>
                <LoadingSkeleton variant="circle" />
              </Box>
            </Flex>
          </Section>

          <Section title="EmptyState">
            <Flex gap={4} wrap="wrap">
              <Box w="250px" bg="bg.secondary" borderRadius="lg" p={4}>
                <EmptyState title="No results" description="Try adjusting your filters." />
              </Box>
              <Box w="250px" bg="bg.secondary" borderRadius="lg" p={4}>
                <EmptyState icon="🔧" title="Under construction" description="This section is not ready yet." />
              </Box>
            </Flex>
          </Section>

          <Section title="MeetingProgress">
            <Flex gap={4} align="center">
              <Box textAlign="center">
                <Text fontSize="xs" color="text.muted" mb={1}>25% elapsed</Text>
                <MeetingProgress start="2026-06-05 09:00" end="2026-06-05 13:00" />
              </Box>
              <Box textAlign="center">
                <Text fontSize="xs" color="text.muted" mb={1}>75% elapsed</Text>
                <MeetingProgress start="2026-06-05 08:00" end="2026-06-05 10:00" />
              </Box>
              <Box textAlign="center">
                <Text fontSize="xs" color="text.muted" mb={1}>Just started</Text>
                <MeetingProgress start="2026-06-05 11:55" end="2026-06-05 12:55" />
              </Box>
            </Flex>
          </Section>

          <Section title="ReservationList">
            <Box maxH="200px" bg="bg.secondary" borderRadius="lg" overflow="hidden">
              <ReservationList
                reservations={sampleRoom.reservations}
                onDelete={(uid) => console.log("Delete:", uid)}
              />
            </Box>
            <Box mt={2} maxH="200px" bg="bg.secondary" borderRadius="lg" overflow="hidden">
              <ReservationList reservations={[]} />
            </Box>
          </Section>

          <Section title="RoomInfoPanel">
            <Box bg="bg.secondary" borderRadius="lg" p={4} maxW="280px">
              <RoomInfoPanel room={sampleRoom} />
            </Box>
          </Section>

          <Section title="RoomStatusCard">
            <Flex gap={4} wrap="wrap">
              <Box w="260px">
                <RoomStatusCard room={{
                  ...sampleRoom,
                  status: "free",
                  reservations: [],
                }} onBook={() => alert("Book!")} />
              </Box>
              <Box w="260px">
                <RoomStatusCard room={{
                  ...sampleRoom,
                  status: "meeting",
                  reservations: [{ uid: "3", title: "Meeting", start: new Date(new Date() - 600000).toISOString().replace("T", " ").slice(0, 16), end: new Date(new Date() + 1800000).toISOString().replace("T", " ").slice(0, 16), reserved_by: "You" }],
                }} onBook={() => alert("Book!")} />
              </Box>
            </Flex>
          </Section>
        </Box>
      )}

      {/* === API TESTS TAB === */}
      {activeTab === "api" && (
        <Box>
          <Section title="fetchRooms">
            <ApiButton label="GET /api/room/fetch/all" action={() => api.fetchRooms()} onResult={setFetchRoomsRes} />
            <JsonBox data={fetchRoomsRes} />
          </Section>

          <Section title="fetchRoom">
            <Flex align="center" gap={2} mb={2}>
              <Input
                size="sm"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                bg="bg.primary"
                borderColor="border.default"
                color="text.primary"
                w="200px"
                placeholder="Room name"
              />
              <ApiButton label="GET /api/room/fetch/name/{name}" action={() => api.fetchRoom(roomNameInput)} onResult={setFetchRoomRes} />
            </Flex>
            <JsonBox data={fetchRoomRes} />
          </Section>

          <Section title="createReservation">
            <ApiButton
              label="POST /api/reservation/create/{name}"
              action={() => api.createReservation("Howard Hughes", {
                title: "Debug Test",
                reserved_by: "Debug",
                start: "2027-06-05 09:00",
                end: "2027-06-05 10:00",
              })}
              onResult={setCreateResRes}
            />
            <JsonBox data={createResRes} />
          </Section>

          <Section title="fetchHistory">
            <ApiButton label="GET /api/reservations/history" action={() => api.fetchHistory()} onResult={setFetchHistoryRes} />
            <JsonBox data={fetchHistoryRes} />
          </Section>

          <Section title="fetchSettings / updateSettings">
            <Flex gap={2} mb={2}>
              <ApiButton label="GET /api/settings" action={() => api.fetchSettings()} onResult={setFetchSettingsRes} />
              <ApiButton label="POST /api/settings" action={() => api.updateSettings({ startingSoonBefore: 10 })} onResult={setUpdateSettingsRes} />
            </Flex>
            <JsonBox data={fetchSettingsRes} />
            <JsonBox data={updateSettingsRes} />
          </Section>

          <Section title="updateRoom">
            <ApiButton
              label='PUT /api/room/update/{name} (set capacity=10)'
              action={() => api.updateRoom("Howard Hughes", { capacity: 10 })}
              onResult={setUpdateRoomRes}
            />
            <JsonBox data={updateRoomRes} />
          </Section>

          <Section title="uploadPhoto">
            <Box as="label" cursor="pointer">
              <Button
                size="sm"
                bg="bg.elevated"
                color="text.primary"
                border="1px solid"
                borderColor="border.default"
                _hover={{ bg: "border.default" }}
                as="span"
              >
                Select file & upload
              </Button>
              <input
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const res = await api.uploadPhoto("Howard Hughes", file);
                    setUploadPhotoRes(res);
                  } catch (err) {
                    setUploadPhotoRes({ error: err.message });
                  }
                }}
              />
            </Box>
            <JsonBox data={uploadPhotoRes} />
          </Section>

          <Section title="deleteReservation (future only)">
            <ApiButton
              label="Delete last created reservation"
              action={async () => {
                const uid = createResRes?.reservation?.uid;
                if (!uid) throw new Error("No reservation UID — create one first");
                return api.deleteReservation("Howard Hughes", uid);
              }}
              onResult={setDeleteResRes}
            />
            <JsonBox data={deleteResRes} />
          </Section>
        </Box>
      )}

      {/* === FLOOR PLAN TAB === */}
      {activeTab === "floorplan" && (
        <Box>
          <Section title="Raw plan data">
            <Text fontSize="sm" color="text.secondary">Walls: {walls.length} | Rooms: {Object.keys(roomPolygons).length}</Text>
          </Section>

          <Section title="FloorPlan SVG">
            <Box
              bg="bg.secondary"
              borderRadius="lg"
              h="600px"
              p={2}
            >
              <FloorPlan
                walls={walls}
                roomPolygons={roomPolygons}
                onRoomClick={(name) => alert(`Room clicked: ${name}`)}
              />
            </Box>
          </Section>

          <Section title="FloorPlan with selection + dimming">
            <Box
              bg="bg.secondary"
              borderRadius="lg"
              h="600px"
              p={2}
            >
              <FloorPlan
                walls={walls}
                roomPolygons={roomPolygons}
                selectedRoom="Youri_Gargarine"
                dimmedRooms={["Youri_Gargarine"]}
                onRoomClick={(name) => alert(`Room clicked: ${name}`)}
              />
            </Box>
          </Section>
        </Box>
      )}
    </Box>
  );
}
