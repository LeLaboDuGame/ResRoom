import { Badge, Box, HStack, Text, VStack, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import colors from "../config/colorTheme";

export const dayStart = 8;
export const dayEnd = 20;

export const slots = [];
for (let h = dayStart; h <= dayEnd; h++) {
    slots.push(`${h}:00`);
    if (h !== dayEnd) slots.push(`${h}:30`);
}

/**
 * Calculates the percentage position of a time string between dayStart and dayEnd hours.
 * @param {string} time - Time in HH:MM format
 * @returns {number} Percentage (0 to 100)
 */
export function timeToPercent(time) {
    if (!time || typeof time !== "string") return 0;
    const parts = time.split(":");
    if (parts.length < 2) return 0;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (isNaN(h) || isNaN(m)) return 0;
    const total = h + m / 60;
    return ((total - dayStart) / (dayEnd - dayStart)) * 100;
}

/**
 * Formats a database datetime string to HH:MM format.
 * @param {string} dateStr - Datetime string in "YYYY-MM-DD HH:mm" format
 * @returns {string} Formatted time string
 */
export function formatTime(dateStr) {
    if (!dateStr) return "00:00";
    try {
        const date = new Date(dateStr.replace(" ", "T"));
        if (isNaN(date.getTime())) return "00:00";
        const h = String(date.getHours()).padStart(2, "0");
        const m = String(date.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
    } catch (e) {
        return "00:00";
    }
}

/**
 * Returns the Chakra UI color scheme for a given room status.
 * @param {string} status - Room status (Free, Starting Soon, Meeting, Finishing Soon)
 * @returns {string} Chakra color scheme
 */
export function getStatusColor(status) {
    switch (status) {
        case "Free":
            return "green";
        case "Starting Soon":
            return "blue";
        case "Meeting":
            return "red";
        case "Finishing Soon":
            return "pink"; // Renders as light red/pink in Chakra UI
        default:
            return "gray";
    }
}

/**
 * Returns the CSS background color for a given room status.
 * @param {string} status - Room status (Free, Starting Soon, Meeting, Finishing Soon)
 * @returns {string} Hex color string
 */
export function getStatusBg(status) {
    switch (status) {
        case "Free":
            return colors.STATUS_FREE;
        case "Starting Soon":
            return colors.STATUS_STARTING_SOON;
        case "Meeting":
            return colors.STATUS_MEETING;
        case "Finishing Soon":
            return colors.STATUS_FINISHING_SOON;
        default:
            return colors.STATUS_DEFAULT;
    }
}

/**
 * Computes the real-time status of a room based on its reservations.
 * @param {Array} reservations - List of reservation objects
 * @returns {string} Room status (Free, Starting Soon, Meeting, Finishing Soon)
 */
export function getRoomStatus(reservations) {
    const now = new Date();
    //now.setHours(19)
    //now.setMinutes(50)

    if (!reservations || !reservations.length) return "Free";

    // Filter and parse reservations
    const parsed = reservations
        .map(r => {
            try {
                return {
                    ...r,
                    startDate: new Date(r.start.replace(" ", "T")),
                    endDate: new Date(r.end.replace(" ", "T"))
                };
            } catch (e) {
                return null;
            }
        })
        .filter(r => r && !isNaN(r.startDate.getTime()) && !isNaN(r.endDate.getTime()));

    // Find any reservation that is currently active
    const active = parsed.find(r => r.startDate <= now && now <= r.endDate);
    if (active) {
        const diffToEnd = (active.endDate - now) / 60000;
        if (diffToEnd <= 15) {
            return "Finishing Soon";
        }
        return "Meeting";
    }

    // Find the next upcoming reservation
    const upcoming = parsed
        .filter(r => r.startDate > now)
        .sort((a, b) => a.startDate - b.startDate);

    if (upcoming.length > 0) {
        const next = upcoming[0];
        const diffToStart = (next.startDate - now) / 60000;
        if (diffToStart <= 15) {
            return "Starting Soon";
        }
    }

    return "Free";
}

/**
 * Checks if a reservation date matches a specific selected date.
 * @param {string} dateStr - Reservation start date string
 * @param {Date} selectedDate - Selected date object
 * @returns {boolean} True if they match the same year, month, and day
 */
export function isSameDay(dateStr, selectedDate) {
    if (!dateStr || !selectedDate) return false;
    const date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return false;

    return (
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate()
    );
}

const DEFAULT_COLOR_PALETTE = [[colors.RESERVATION_PALETTE[0].border, colors.RESERVATION_PALETTE[0].bg]];

/**
 * RoomTimeline Component
 */
export function RoomTimeline({ rooms, currentTime, selectedDate, onReservationClick, colorPalette = DEFAULT_COLOR_PALETTE }) {
    const navigate = useNavigate();
    const filterDate = selectedDate || new Date();

    // Check if there are any rooms
    if (!rooms || rooms.length === 0) {
        return (
            <Box p={6} textAlign="center">
                <Text color={colors.INPUT_PLACEHOLDER} fontSize="lg">Aucune salle disponible</Text>
            </Box>
        );
    }

    // Calculate current time line percentage if within hours range
    let timeStr = currentTime;
    if (!timeStr) {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, "0");
        const m = String(now.getMinutes()).padStart(2, "0");
        timeStr = `${h}:${m}`;
    }
    const [curH, curM] = timeStr.split(":").map(Number);
    const curTotal = curH + curM / 60;
    const showCurrentTimeLine = curTotal >= dayStart && curTotal <= dayEnd;
    const currentPercent = showCurrentTimeLine ? ((curTotal - dayStart) / (dayEnd - dayStart)) * 100 : 0;

    // Check if any room has reservations for the filtered date
    const hasAnyReservations = rooms.some(room =>
        room.reservations && room.reservations.some(res => isSameDay(res.start, filterDate))
    );

    return (
        <Box
            w="100%"
            bg={colors.CARD_BG}
            borderRadius="xl"
            border="1px solid"
            borderColor={colors.CARD_BORDER}
            p={6}
            boxShadow="md"
            color={colors.TEXT_PRIMARY}
        >
            {/* Horizontal Hour Labels Row */}
            <Flex align="center" mb={6} position="relative">
                {/* Left Column Spacer matching the Room list width */}
                <Box w="240px" pr={4}>
                    <Text fontSize="xs" fontWeight="bold" color={colors.ACCENT} letterSpacing="wider">
                        SALLES / RESERVATIONS
                    </Text>
                </Box>
                {/* Right Column: Time axis labels */}
                <Box flex="1" position="relative" h="20px">
                    {slots.filter((_, idx) => idx % 2 === 0).map((t) => (
                        <Box
                          key={t}
                          position="absolute"
                          left={`${timeToPercent(t)}%`}
                          transform="translateX(-50%)"
                        >
                            <Text fontSize="11px" fontWeight="semibold" color={colors.TEXT_PRIMARY}>
                                {t}
                            </Text>
                        </Box>
                    ))}
                    {/* Time line indicator marker on axis */}
                    {showCurrentTimeLine && (
                        <Box
                            position="absolute"
                            left={`${currentPercent}%`}
                            top="30px"
                            h="8px"
                            w="8px"
                            borderRadius="full"
                            bg={colors.TIMELINE_NOW_DOT_BG}
                            transform="translate(-50%, -50%)"
                            boxShadow={`0 0 8px ${colors.TIMELINE_NOW_GLOW}`}
                            zIndex={5}
                        />
                    )}
                </Box>
            </Flex>

            {/* Room Timeline Tracks */}
            <VStack gap={5} align="stretch" position="relative">
                {rooms.map((room, idx) => {
                    const roomReservations = (room.reservations || []).filter(res =>
                        isSameDay(res.start, filterDate)
                    );
                    const [borderColor, bgColor] = colorPalette[idx % colorPalette.length];

                    return (
                        <Flex key={room.name + '-' + idx} align="center" position="relative">
                            {/* Room Info Left Column */}
                            <Box w="240px" pr={4}>
                                <HStack justify="space-between" align="center">
                                    <VStack align="start" gap={0.5}>
                                        <Text
                                            fontSize="md"
                                            fontWeight="bold"
                                            color={colors.TEXT_PRIMARY}
                                            noOfLines={1}
                                            cursor="pointer"
                                            _hover={{ color: colors.ACCENT }}
                                            onClick={() => navigate(`/rooms/${encodeURIComponent(room.name)}`)}
                                        >
                                            {room.name}
                                        </Text>
                                        <Text fontSize="xs" color={colors.CARD_BORDER} noOfLines={1}>
                                            {room.description ? room.description.split('\n')[0].replace("- ", "") : `${room.size} capacity`}
                                        </Text>
                                    </VStack>
                                    <Badge
                                        bg={getStatusBg(room.status || getRoomStatus(room.reservations))}
                                        color={colors.BADGE_TEXT}
                                        px={2}
                                        py={0.5}
                                        borderRadius="md"
                                    >
                                        {room.status || getRoomStatus(room.reservations)}
                                    </Badge>
                                </HStack>
                            </Box>

                            {/* Timeline Track Right Column */}
                            <Box
                                flex="1"
                                position="relative"
                                h="52px"
                                bg={colors.TIMELINE_TRACK_BG}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor={colors.TIMELINE_TRACK_BORDER}
                                overflow="visible"
                                cursor="pointer"
                                transition="all 0.2s ease"
                                _hover={{ borderColor: colors.TIMELINE_TRACK_HOVER_BORDER, bg: colors.TIMELINE_TRACK_HOVER_BG }}
                                onClick={() => navigate(`/rooms/${encodeURIComponent(room.name)}`)}
                            >
                                {/* Vertical hour grid lines */}
                                {slots.filter((_, idx) => idx % 2 === 0).map((t) => (
                                    <Box
                                        key={`grid-${t}`}
                                        position="absolute"
                                        left={`${timeToPercent(t)}%`}
                                        h="100%"
                                        w="1px"
                                        bg={colors.TIMELINE_GRID_LINE}
                                        opacity={0.35}
                                        zIndex={1}
                                    />
                                ))}

                                {/* Reservations blocks */}
                                {roomReservations.map((res, i) => {
                                    const startPercent = Math.max(0, timeToPercent(formatTime(res.start)));
                                    const endPercent = Math.min(100, timeToPercent(formatTime(res.end)));
                                    const width = Math.max(0, endPercent - startPercent);
                                    const isNearEnd = startPercent > 75;

                                    return (
                                        <Box
                                            key={res.uid || i}
                                            position="absolute"
                                            top="10%"
                                            left={isNearEnd ? "auto" : `${startPercent}%`}
                                            right={isNearEnd ? `${100 - endPercent}%` : "auto"}
                                            w={`${width}%`}
                                            h="80%"
                                            bg={bgColor}
                                            borderRadius="md"
                                            px={3}
                                            py={1}
                                            zIndex={2}
                                            overflow="hidden"
                                            display="flex"
                                            flexDirection="column"
                                            justifyContent="center"
                                            borderLeft="3px solid"
                                            borderLeftColor={borderColor}
                                            boxShadow="sm"
                                            role="group"
                                            transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                                            _hover={{
                                                w: "max-content",
                                                minW: `${width}%`,
                                                zIndex: 10,
                                                boxShadow: "2xl",
                                                transform: "scale(1.02)",
                                                overflow: "visible",
                                                left: isNearEnd ? "auto" : `${startPercent}%`,
                                                right: isNearEnd ? `${100 - endPercent}%` : "auto",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Avoid triggering navigation to RoomPage twice
                                                if (onReservationClick) {
                                                    onReservationClick(res);
                                                } else {
                                                    navigate(`/rooms/${encodeURIComponent(room.name)}`);
                                                }
                                            }}
                                        >
                                            <Text fontSize="11px" fontWeight="bold" color={colors.TEXT_PRIMARY} noOfLines={1} lineHeight="short" whiteSpace="nowrap">
                                                {res.title}
                                            </Text>
                                            <Text fontSize="9px" color={colors.ACCENT} noOfLines={1} whiteSpace="nowrap">
                                                {formatTime(res.start)} - {formatTime(res.end)} | {res.reserved_by}
                                            </Text>
                                        </Box>
                                    );
                                })}

                                {!roomReservations.length && (
                                <Flex position="absolute" inset={0} justify="center" align="center">
                                    <Text color={colors.ACCENT} fontSize="xs" fontWeight="medium">
                                        Aucune réservation
                                    </Text>
                                </Flex>
                                )}

                                {/* Current Time Line */}
                                {showCurrentTimeLine && (
                                    <Box
                                        position="absolute"
                                        left={`${currentPercent}%`}
                                        top="0"
                                        bottom="0"
                                        w="2px"
                                        bg={colors.TIMELINE_NOW_LINE_BG}
                                        zIndex={3}
                                        pointerEvents="none"
                                        boxShadow={`0 0 6px ${colors.TIMELINE_LINE_GLOW}`}
                                    />
                                )}
                            </Box>
                        </Flex>
                    );
                })}
            </VStack>
        </Box>
    );
}

/**
 * Compatibility wrapper function to render the RoomTimeline component.
 */
export function renderRoomTimeline(rooms, currentTime, selectedDate = null, onReservationClick = null, colorPalette) {
    return (
        <RoomTimeline
            rooms={rooms}
            currentTime={currentTime}
            selectedDate={selectedDate}
            onReservationClick={onReservationClick}
            colorPalette={colorPalette}
        />
    );
}
