import {useState, useEffect, useMemo, useCallback} from "react";
import {Box, Flex, Text, IconButton, Spinner} from "@chakra-ui/react";
import {useParams, useNavigate} from "react-router-dom";
import {ArrowLeft} from "lucide-react";
import {useRoom, useRooms} from "../hooks/useRooms";
import {deleteReservation} from "../api/apiCall.js";
import {RoomStatusCard} from "../components/room/RoomStatusCard";
import {Calendar} from "../components/room/Calendar.jsx";
import {RoomInfoPanel} from "../components/room/RoomInfoPanel";
import {BookingForm} from "../components/booking/BookingForm";
import {BookingButton} from "../components/booking/BookingButton";
import {FilterBar} from "../components/ui/FilterBar";
import {ResRoomLogo} from "../components/ui/ResRoomLogo";
import {FloorPlan} from "../components/floorplan/FloorPlan";
import {SETTINGS} from "../config/settings";

/**
 * Fleet/kiosk room page at route "/fleet/:roomName".
 * Displays a full-screen room status view with a split layout:
 * left side shows the room status card, right side shows
 * today's reservations. Includes a booking flow with a floor
 * plan, filter bar, and booking form. Resets to room view
 * after a configurable inactivity timeout.
 * @returns {JSX.Element} The fleet room layout
 */
export default function FleetRoom() {
    const {roomName} = useParams();
    const navigate = useNavigate();
    const {room, loading, error, refetchRoom} = useRoom(roomName);
    const {rooms, refetchRooms} = useRooms();

    const [view, setView] = useState("room");
    const [selectedRoomName, setSelectedRoomName] = useState(roomName);
    const [bookingKey, setBookingKey] = useState(0);
    const [filters, setFilters] = useState({capacity: 0, tv: false, whiteboard: false, computer: false});

    // Reset selected room when current room changes
    useEffect(() => {
        setSelectedRoomName(roomName);
    }, [roomName]);

    // Inactivity timer
    useEffect(() => {
        let timer = setTimeout(() => {
            navigate(`/fleet/${encodeURIComponent(roomName)}`, {replace: true});
        }, SETTINGS.INACTIVITY_TIMEOUT * 60 * 1000);

        function resetTimer() {
            clearTimeout(timer);
            timer = setTimeout(() => {
                navigate(`/fleet/${encodeURIComponent(roomName)}`, {replace: true});
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
        refetchRoom();
        refetchRooms();
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
                <Spinner size="xl" color="accent.default" thickness="4px"/>
            </Box>
        );
    }

    if (error || !room) {
        return (
            <Box minH="100vh" bg="#0a0a0b" display="flex" alignItems="center" justifyContent="center" flexDir="column"
                 gap={4}>
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
                {/* Floating logo badge */}
                <Flex
                    position="absolute"
                    top={4}
                    left={4}
                    zIndex={20}
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    bg="bg.elevated"
                    align="center"
                    justify="center"
                    boxShadow="0 0 12px rgba(0,0,0,0.5)"
                >
                    <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                        <ResRoomLogo h="32px"/>
                    </Box>
                </Flex>

                <Flex h="100%" w="100%">
                    {/* Left 50%: Room status card */}
                    <Box w="50%" h="100%" p={6} display="flex" flexDirection="column">
                        <Box w="100%" maxW="500px" flex={1} display="flex" flexDirection="column">
                            <RoomStatusCard room={room} onBook={goToBooking} activateReservationButton={false}/>
                        </Box>
                    </Box>

                    {/* Right 50%: Reservation list */}
                    <Box w="50%" h="100%" p={6} pb="100px" display="flex" flexDirection="column">
                        <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={4}>
                            Réservations du jour
                        </Text>
                        <Box flex={1} bg="bg.secondary" borderRadius="xl" overflow="hidden">
                            <Calendar
                                reservations={room?.reservations || []}
                                roomName={room?.name}
                                existingReservations={room?.reservations || []}
                                onBookingSuccess={handleBookingSuccess}
                                collapsibleContent={({pendingReservation, onTimeChange, onSuccess, onCancel}) => (
                                    <BookingForm
                                        roomName={room?.name}
                                        existingReservations={room?.reservations || []}
                                        defaultDate={pendingReservation.date}
                                        defaultHour={parseInt(pendingReservation.startHour.split(":")[0], 10)}
                                        defaultMinute={parseInt(pendingReservation.startHour.split(":")[1], 10)}
                                        onTimeChange={onTimeChange}
                                        onSuccess={onSuccess}
                                        onCancel={onCancel}
                                    />
                                )}
                            />
                        </Box>
                    </Box>
                </Flex>

                {/* Bottom-right booking button */}
                <Box position="absolute" bottom={8} right={8} zIndex={10}>
                    <BookingButton variant="plus" onClick={goToBooking} ariaLabel="Réserver une salle"/>
                </Box>
            </Box>
        );
    }

    // === BOOKING FLOW ===
    const currentRoom = selectedRoomData || room;

    return (
        <Box h="100vh" w="100vw" overflow="hidden" bg="#0a0a0b" position="relative">

            <Flex h="100%" w="100%">
                {/* Left 35%: calendar + form */}
                <Box w="35%" h="100%" p={6} display="flex" flexDirection="column" gap={4} overflow="hidden">
                    {/* Back button */}
                    <Flex align="center" gap={3}>
                        <IconButton
                            aria-label="Retour"
                            size="sm"
                            variant="ghost"
                            color="text.secondary"
                            _hover={{color: "text.primary"}}
                            onClick={goToRoom}
                        >
                            <ArrowLeft size={20}/>
                        </IconButton>
                        <Text fontSize="lg" fontWeight="bold" color="text.primary">
                            {currentRoom.name}
                        </Text>
                    </Flex>

                    {/* Calendar */}
                    <Box flex={1} overflowY="auto" bg="bg.secondary" borderRadius="xl">
                        <Calendar
                            reservations={currentRoom?.reservations || []}
                            roomName={currentRoom?.name}
                            existingReservations={currentRoom?.reservations || []}
                            onBookingSuccess={handleBookingSuccess}
                            collapsibleContent={({pendingReservation, onTimeChange, onSuccess, onCancel}) => (
                                <BookingForm
                                    roomName={currentRoom?.name}
                                    existingReservations={currentRoom?.reservations || []}
                                    defaultDate={pendingReservation.date}
                                    defaultHour={parseInt(pendingReservation.startHour.split(":")[0], 10)}
                                    defaultMinute={parseInt(pendingReservation.startHour.split(":")[1], 10)}
                                    onTimeChange={onTimeChange}
                                    onSuccess={onSuccess}
                                    onCancel={onCancel}
                                />
                            )}
                        />
                    </Box>
                </Box>

                {/* Right 65%: Floor plan */}
                <Box w="65%" h="100%" position="relative">
                    <Box
                        position="absolute"
                        top={{base: "64px", md: 3}}
                        right={3}
                        zIndex={10}
                        bg="rgba(21,21,24,0.85)"
                        borderRadius="md"
                        px={3}
                        py={2}
                        pointerEvents="none"
                        userSelect="none"
                    >
                        <Box borderRadius="lg" p={4}>
                            <RoomInfoPanel room={currentRoom}/>
                        </Box>
                    </Box>
                    <Box
                        position="absolute"
                        left={{base: "64px", md: 3}}
                        right={3}
                        zIndex={10}
                        bg="rgba(21,21,24,0.85)"
                        borderRadius="md"
                        px={3}
                        py={2}
                        w="md"
                    >
                        <FilterBar onChange={setFilters}/>

                    </Box>

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
