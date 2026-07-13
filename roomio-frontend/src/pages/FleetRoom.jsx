import {useState, useEffect, useMemo, useCallback, useRef} from "react";
import {
    Box,
    Flex,
    Text,
    IconButton,
    Spinner,
    Button,
    SplitterRoot,
    SplitterPanel,
    SplitterResizeTrigger
} from "@chakra-ui/react";
import {useParams, useNavigate} from "react-router-dom";
import {ArrowLeft, ChevronLeft, ChevronRight} from "lucide-react";
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
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [bookingFormData, setBookingFormData] = useState(null);
    const [leftPanelSize, setLeftPanelSize] = useState(35);
    const calendarSplitDays = leftPanelSize >= 30 ? 2 : 1;

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
                const cap = r.elements.capacity || 0;
                if (filters.capacity === "petite" && (cap < 1 || cap > 3)) return false;
                if (filters.capacity === "moyenne" && (cap < 4 || cap > 6)) return false;
                if (filters.capacity === "grande" && cap < 7) return false;
                for (const eq of activeEq) {
                    if (!r.elements[eq]) return false;
                }
                return true;
            })
            .map((r) => r.name);
    }, [rooms, filters]);

    /** Called after a successful booking — refreshes room data and returns to room view. */
    function handleBookingSuccess() {
        setBookingKey((k) => k + 1);
        refetchRoom();
        refetchRooms();
        goToRoom();
    }

    /**
     * Deletes a reservation and refreshes room data.
     * @param {string} uid Reservation UID
     */
    async function handleDeleteReservation(uid) {
        setDeleteError(null);
        try {
            await deleteReservation(roomName, uid);
            setDeleteTarget(null);
            refetchRoom();
            refetchRooms();
        } catch (e) {
            setDeleteError(e?.message || "Erreur lors de la suppression");
        }
    }

    const swipeRef = useRef(null);
    const leftPanelRef = useRef(null);
    const calendarRef = useRef(null);

    /**
     * Captures pointer start for left-edge swipe (opening booking view).
     * Only activates when the pointer enters the rightmost 40 px of the screen.
     * @param {React.PointerEvent} e Pointer event
     */
    function handleSwipeStart(e) {
        if (e.clientX > window.innerWidth - 40) {
            swipeRef.current = {startX: e.clientX, startY: e.clientY};
        }
    }

    /**
     * If a left-edge swipe exceeds 50 px leftward with minimal vertical drift, opens booking view.
     * @param {React.PointerEvent} e Pointer event
     */
    function handleSwipeMove(e) {
        if (!swipeRef.current) return;
        const dx = e.clientX - swipeRef.current.startX;
        const dy = Math.abs(e.clientY - swipeRef.current.startY);
        if (dx < -50 && dy < 100) {
            swipeRef.current = null;
            goToBooking();
        }
    }

    /** Cleans up swipe state on pointer up. */
    function handleSwipeEnd() {
        swipeRef.current = null;
    }

    /**
     * Captures pointer start for right-edge swipe (returning from booking view).
     * Only activates when the pointer enters the leftmost 40 px of the screen.
     * @param {React.PointerEvent} e Pointer event
     */
    function handleBookingSwipeStart(e) {
        if (e.clientX < 40) {
            swipeRef.current = {startX: e.clientX, startY: e.clientY};
        }
    }

    /**
     * If a right-edge swipe exceeds 50 px rightward with minimal vertical drift, returns to room view.
     * @param {React.PointerEvent} e Pointer event
     */
    function handleBookingSwipeMove(e) {
        if (!swipeRef.current) return;
        const dx = e.clientX - swipeRef.current.startX;
        const dy = Math.abs(e.clientY - swipeRef.current.startY);
        if (dx > 50 && dy < 100) {
            swipeRef.current = null;
            goToRoom();
        }
    }

    /** Cleans up booking-swipe state on pointer up. */
    function handleBookingSwipeEnd() {
        swipeRef.current = null;
    }

    /**
     * Pushes a history entry and switches to the booking view.
     * Enables back-gesture interception via popstate.
     */
    function goToBooking() {
        window.history.pushState({view: "booking"}, "");
        setView("booking");
        setSelectedRoomName(roomName);
    }

    /** Returns to the room view (no history entry). */
    function goToRoom() {
        setView("room");
        setSelectedRoomName(roomName);
    }

    // Intercept browser back gesture (edge swipe / hardware back) → go to room view
    useEffect(() => {
        const handler = () => {
            if (view === "booking") {
                goToRoom();
            }
        };
        window.addEventListener("popstate", handler);
        return () => window.removeEventListener("popstate", handler);
    }, [view]);

    // Track left panel width → auto split calendar when ≥ 30%
    useEffect(() => {
        const el = leftPanelRef.current;
        if (!el || view !== "booking") return;
        const observer = new ResizeObserver((entries) => {
            const {width} = entries[0].contentRect;
            const pct = (width / window.innerWidth) * 100;
            setLeftPanelSize(pct);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [view]);

    const pendingTimeRange = useMemo(() => {
        if (!bookingFormData) return null;
        return {startHour: bookingFormData.startHour, endHour: bookingFormData.endHour};
    }, [bookingFormData]);

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
            <Box h="100vh" w="100vw" overflow="hidden" bg="#0a0a0b" position="relative" style={{touchAction: "pan-y"}}
                 onPointerDown={handleSwipeStart} onPointerMove={handleSwipeMove} onPointerUp={handleSwipeEnd}>
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
                    <Box w="50%" h="100%" p={6} display="flex">
                        <Box w="100%" maxW="95%" flex={1} display="flex">
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
                                ref={calendarRef}
                                key={bookingKey}
                                reservations={room?.reservations || []}
                                existingReservations={room?.reservations || []}
                                onBookingSuccess={handleBookingSuccess}
                                onDeleteReservation={setDeleteTarget}
                                onNewReservation={(data) => setBookingFormData(data)}
                                pendingTimeRange={pendingTimeRange}
                                splitDays={2}
                                hideTodayButton
                            />
                        </Box>
                    </Box>
                </Flex>

                {/* Bottom-right: Today button + map button */}
                <Flex position="absolute" bottom={8} right={8} zIndex={10} gap={3} align="center">
                    <Button
                        size="sm"
                        bg="blue.700/30"
                        color="white"
                        fontWeight="semibold"
                        fontSize="sm"
                        px={4}
                        py={1}
                        borderRadius="50px"
                        _hover={{bg: "blue.400"}}
                        onClick={() => calendarRef.current?.goToToday()}
                    >
                        Today
                    </Button>
                    <BookingButton variant="plus" onClick={goToBooking} ariaLabel="Réserver une salle"/>
                </Flex>

                {/* Swipe indicator */}
                <Flex
                    position="absolute"
                    right={0}
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex={5}
                    align="center"
                    justify="center"
                    pointerEvents="none"
                    userSelect="none"
                    w={5}
                    h={12}
                    bg="rgba(255,255,255,0.06)"
                    borderLeft="1px solid rgba(255,255,255,0.1)"
                    borderRight="1px solid rgba(255,255,255,0.1)"
                    borderLeftRadius="md"
                    style={{borderTopRightRadius: 0, borderBottomRightRadius: 0}}
                >
                    <ChevronLeft size={20} color="rgba(255,255,255,0.35)" strokeWidth={2.5}/>
                </Flex>

                {deleteTarget && (
                    <Box position="fixed" inset={0} bg="rgba(0,0,0,0.6)" display="flex" alignItems="center"
                         justifyContent="center" zIndex={9999} onClick={() => {
                        setDeleteTarget(null);
                        setDeleteError(null);
                    }}>
                        <Box bg="bg.elevated" borderRadius="xl" border="1px solid" borderColor="border.default"
                             p={6} w="90%" maxW="400px" onClick={(e) => e.stopPropagation()}>
                            <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={1}>
                                Supprimer la réservation
                            </Text>
                            <Text fontSize="sm" color="text.secondary" mb={6}>
                                "{deleteTarget.title}"
                                — {deleteTarget.start?.slice(11, 16)} à {deleteTarget.end?.slice(11, 16)}
                            </Text>
                            {deleteError && (
                                <Text fontSize="sm" color="red.400" mb={4}>
                                    {deleteError}
                                </Text>
                            )}
                            <Flex gap={2} justify="flex-end">
                                <Button size="sm" variant="ghost" color="text.secondary"
                                        _hover={{color: "text.primary", bg: "bg.secondary"}}
                                        onClick={() => {
                                            setDeleteTarget(null);
                                            setDeleteError(null);
                                        }}>
                                    Non
                                </Button>
                                <Button size="sm" bg="#f87171" color="white" _hover={{bg: "#ef4444"}}
                                        onClick={() => handleDeleteReservation(deleteTarget.uid)}>
                                    Oui
                                </Button>
                            </Flex>
                        </Box>
                    </Box>
                )}

                {bookingFormData && (
                    <Box position="fixed" inset={0} bg="rgba(0,0,0,0.6)" display="flex" alignItems="center"
                         justifyContent="center" zIndex={9999}
                         onClick={() => {
                             setBookingFormData(null);
                             setBookingKey(k => k + 1);
                         }}>
                        <Box bg="rgba(17, 21, 34, 0.95)" borderRadius="xl" border="1px solid"
                             borderColor="border.default"
                             p={6} w="90%" maxW="420px" maxH="85vh" overflowY="auto"
                             onClick={(e) => e.stopPropagation()}>
                            <BookingForm
                                roomName={room?.name}
                                existingReservations={room?.reservations || []}
                                defaultDate={bookingFormData.date}
                                defaultHour={parseInt(bookingFormData.startHour.split(":")[0], 10)}
                                defaultMinute={parseInt(bookingFormData.startHour.split(":")[1], 10)}
                                onTimeChange={(h, m, eh, em) => {
                                    const startHour = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                                    const endHour = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                                    setBookingFormData(prev => prev ? {...prev, startHour, endHour} : prev);
                                }}
                                onSuccess={(reservation) => {
                                    setBookingFormData(null);
                                    handleBookingSuccess(reservation);
                                }}
                                onCancel={() => {
                                    setBookingFormData(null);
                                    setBookingKey(k => k + 1);
                                }}
                            />
                        </Box>
                    </Box>
                )}
            </Box>
        );
    }

    const currentRoom = selectedRoomData || room;

    return (
        <Box h="100vh" w="100vw" overflow="hidden" bg="#0a0a0b" position="relative"
             onPointerDown={handleBookingSwipeStart} onPointerMove={handleBookingSwipeMove}
             onPointerUp={handleBookingSwipeEnd}>

            {/* Swipe indicator — left edge */}
            <Flex
                position="absolute"
                left={0}
                top="50%"
                transform="translateY(-50%)"
                zIndex={30}
                align="center"
                justify="center"
                pointerEvents="none"
                userSelect="none"
                w={5}
                h={12}
                bg="rgba(255,255,255,0.06)"
                borderLeft="1px solid rgba(255,255,255,0.1)"
                borderRight="1px solid rgba(255,255,255,0.1)"
                borderRightRadius="md"
                style={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0}}
            >
                <ChevronRight size={20} color="rgba(255,255,255,0.35)" strokeWidth={2.5}/>
            </Flex>

            <SplitterRoot defaultSize={[35, 65]} panels={[{id: "left"}, {id: "right"}]}
                          style={{height: "100%", width: "100%"}}>
                <SplitterPanel id="left" style={{
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    overflow: "hidden"
                }}>
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
                    <Box ref={leftPanelRef} flex={1} overflowY="auto" bg="bg.secondary" borderRadius="xl">
                        <Calendar
                            key={bookingKey}
                            reservations={currentRoom?.reservations || []}
                            existingReservations={currentRoom?.reservations || []}
                            onBookingSuccess={handleBookingSuccess}
                            onNewReservation={(data) => setBookingFormData(data)}
                            pendingTimeRange={pendingTimeRange}
                            splitDays={calendarSplitDays}
                        />
                    </Box>
                </SplitterPanel>

                <SplitterResizeTrigger
                    id="left:right"
                    style={{
                        width: 16,
                        cursor: "col-resize",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        outline: "none",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: 2,
                            height: "100%",
                            background: "#2a2a2d",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 32,
                                background: "#1a1a1d",
                                border: "1px solid #333",
                                borderRadius: 4,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 3,
                            }}
                        >
                            <div style={{width: 3, height: 3, borderRadius: "50%", background: "#666"}}/>
                            <div style={{width: 3, height: 3, borderRadius: "50%", background: "#666"}}/>
                            <div style={{width: 3, height: 3, borderRadius: "50%", background: "#666"}}/>
                        </div>
                    </div>
                </SplitterResizeTrigger>

                <SplitterPanel id="right" style={{position: "relative"}}>
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
                        tabletRoom={roomName}
                    />

                </SplitterPanel>
            </SplitterRoot>

            {deleteTarget && (
                <Box position="fixed" inset={0} bg="rgba(0,0,0,0.6)" display="flex" alignItems="center"
                     justifyContent="center" zIndex={9999} onClick={() => {
                    setDeleteTarget(null);
                    setDeleteError(null);
                }}>
                    <Box bg="bg.elevated" borderRadius="xl" border="1px solid" borderColor="border.default"
                         p={6} w="90%" maxW="400px" onClick={(e) => e.stopPropagation()}>
                        <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={1}>
                            Supprimer la réservation
                        </Text>
                        <Text fontSize="sm" color="text.secondary" mb={6}>
                            "{deleteTarget.title}"
                            — {deleteTarget.start?.slice(11, 16)} à {deleteTarget.end?.slice(11, 16)}
                        </Text>
                        {deleteError && (
                            <Text fontSize="sm" color="red.400" mb={4}>
                                {deleteError}
                            </Text>
                        )}
                        <Flex gap={2} justify="flex-end">
                            <Button size="sm" variant="ghost" color="text.secondary"
                                    _hover={{color: "text.primary", bg: "bg.secondary"}}
                                    onClick={() => {
                                        setDeleteTarget(null);
                                        setDeleteError(null);
                                    }}>
                                Non
                            </Button>
                            <Button size="sm" bg="#f87171" color="white" _hover={{bg: "#ef4444"}}
                                    onClick={() => handleDeleteReservation(deleteTarget.uid)}>
                                Oui
                            </Button>
                        </Flex>
                    </Box>
                </Box>
            )}

            {bookingFormData && (
                <Box position="fixed" inset={0} bg="rgba(0,0,0,0.6)" display="flex" alignItems="center"
                     justifyContent="center" zIndex={9999}
                     onClick={() => {
                         setBookingFormData(null);
                         setBookingKey(k => k + 1);
                     }}>
                    <Box bg="rgba(17, 21, 34, 0.95)" borderRadius="xl" border="1px solid" borderColor="border.default"
                         p={6} w="90%" maxW="420px" maxH="85vh" overflowY="auto"
                         onClick={(e) => e.stopPropagation()}>
                        <BookingForm
                            roomName={currentRoom?.name}
                            existingReservations={currentRoom?.reservations || []}
                            defaultDate={bookingFormData.date}
                            defaultHour={parseInt(bookingFormData.startHour.split(":")[0], 10)}
                            defaultMinute={parseInt(bookingFormData.startHour.split(":")[1], 10)}
                            onTimeChange={(h, m, eh, em) => {
                                const startHour = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                                const endHour = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                                setBookingFormData(prev => prev ? {...prev, startHour, endHour} : prev);
                            }}
                            onSuccess={(reservation) => {
                                setBookingFormData(null);
                                handleBookingSuccess(reservation);
                            }}
                            onCancel={() => {
                                setBookingFormData(null);
                                setBookingKey(k => k + 1);
                            }}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}
