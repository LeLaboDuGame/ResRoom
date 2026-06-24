import {useState, createContext, useContext, useRef, useCallback, useMemo} from "react";
import {
    Box, Flex, Text, ScrollArea, Stack, Collapsible
} from "@chakra-ui/react";
import {BookingForm} from "../booking/BookingForm";
import {useSettings} from "../../hooks/useSettings";
import {keyframes} from "@emotion/react";

/** Row height in pixels for each hour slot */
const ROW_H = 70;
/** Top padding of the container in pixels */
const PAD_T = 8;
/** Snap interval in hours (0.25 = 15 minutes) */
const SNAP = 0.25;
/** Max time (ms) between clicks to consider it a double-click */
const DBL_CLICK_DELAY = 300;

const CalendarCtx = createContext({dayStart: 7});
/**
 * Bump scale-in animation with overshoot and bounce.
 * Starts small, overshoots past full size, then settles.
 */
const bumpIn = keyframes`
    0% {
        transform: scale(0.85, 0.5);
    }
    60% {
        transform: scale(1.06, 1.06);
    }
    80% {
        transform: scale(0.9, 0.9);
    }
    100% {
        transform: scale(1, 1);
    }
`;

/**
 * Converts "HH:mm" to decimal hours (e.g. "14:30" => 14.5).
 * @param {string} t Time string in HH:mm format
 * @returns {number} Decimal hours
 */
function toDec(t) {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
}

/**
 * Snaps a decimal value to the nearest SNAP interval.
 * @param {number} v Value in decimal hours
 * @returns {number} Snapped decimal hours
 */
function snap(v) {
    return Math.round(v / SNAP) * SNAP;
}

/**
 * Formats decimal hours to "HH:mm" string.
 * @param {number} dec Decimal hours
 * @returns {string} Formatted time string
 */
function fmtHHMM(dec) {
    const h = Math.floor(dec);
    const m = Math.round((dec % 1) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Absolutely positioned reservation block on the hour grid.
 * @param {string} startHour Start time in HH:mm
 * @param {string} endHour End time in HH:mm
 * @param {string} [color="blue.500"] Chakra color token
 * @param {React.ReactNode} children Inner content (title, time, etc.)
 * @param {Object} rest Additional Box props (animation, etc.)
 * @returns {JSX.Element} Reservation block
 */
export function Reservation({startHour, endHour, color = "blue.500", children, ...rest}) {
    const {dayStart} = useContext(CalendarCtx);
    const top = PAD_T + (toDec(startHour) - dayStart) * ROW_H + ROW_H / 2;
    const h = (toDec(endHour) - toDec(startHour)) * ROW_H;

    return (
        <Box
            position="absolute"
            top={`${top}px`}
            h={`${Math.max(h, 4)}px`}
            left="65px"
            right="5px"
            bg={color}
            borderRadius="md"
            zIndex={5}
            px={2}
            py={1}
            overflow="hidden"
            {...rest}
        >
            {children}
        </Box>
    );
}

/**
 * Calendar background grid with hour labels, separator lines, current-time bar,
 * and a slot for children (reservation blocks).
 * Provides dayStart/dayEnd via CalendarCtx.
 * @param {number} [dayStart=7] First displayed hour
 * @param {number} [dayEnd=20] Last displayed hour
 * @param {boolean} [isToday=true] Whether the selected day is today (shows current-time bar)
 * @param {React.ReactNode} children Reservation blocks
 * @param {Object} gridRef Ref for the grid container
 * @param {Function} onPointerDown Pointer down handler
 * @param {Function} onPointerMove Pointer move handler
 * @param {Function} onPointerUp Pointer up handler
 * @returns {JSX.Element} Background calendar grid
 */
function BgCalendar({dayStart = 7, dayEnd = 20, isToday = true, children, gridRef, onPointerDown, onPointerMove, onPointerUp}) {
    const hours = Array.from({length: dayEnd - dayStart + 1}, (_, i) => dayStart + i);

    const now = new Date();
    const curHour = now.getHours() + now.getMinutes() / 60;
    const barTop = PAD_T + (curHour - dayStart) * ROW_H + ROW_H / 2;
    const showBar = curHour >= dayStart && curHour <= dayEnd;

    const totalH = PAD_T + hours.length * ROW_H + PAD_T;

    return (
        <CalendarCtx.Provider value={{dayStart, dayEnd}}>
            <ScrollArea.Root>
                <ScrollArea.Viewport>
                    <Box
                        ref={gridRef}
                        position="relative"
                        h={`${totalH}px`}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                    >
                        {/* Hour labels and separator lines */}
                        <Stack gap={0} py={2} pointerEvents="none">
                            {hours.map(hour => (
                                <Flex key={hour} h={`${ROW_H}px`} align="center" w="100%">
                                    <Text w="60px" textAlign="right" pr={3} color="text.secondary" fontSize="sm"
                                          flexShrink={0}>
                                        {hour}:00
                                    </Text>
                                    <Box flex={1} h="1px" bg="whiteAlpha.400"/>
                                </Flex>
                            ))}
                        </Stack>

                        {/* Current time red bar */}
                        {showBar && isToday && (
                            <Box
                                position="absolute"
                                top={`${barTop}px`}
                                left="60px"
                                right="0"
                                h="2px"
                                bg="red.500"
                                zIndex={10}
                                pointerEvents="none"
                            />
                        )}

                        {/* Reservation blocks (from Calendar parent) */}
                        {children}
                    </Box>
                </ScrollArea.Viewport>
            </ScrollArea.Root>
        </CalendarCtx.Provider>
    );
}



/**
 * Main calendar component with reservation display, long-press provisional creation,
 * drag of the provisional block, and collapsible booking form on release.
 * @param {Array} [reservations=[]] List of reservation objects
 * @param {Function} [onNewReservation] Called with (date, start, end) on provisional release
 * @param {string} [roomName] Room name (enables collapsible booking form)
 * @param {Array} [existingReservations] Existing reservations for overlap check
 * @param {Function} [onDeleteReservation] Called with reservation object on double-click
 * @param {Function} [onBookingSuccess] Called with new reservation after successful booking
 * @returns {JSX.Element} Calendar component
 */
export function Calendar({reservations = [], onNewReservation, roomName, existingReservations = [], onDeleteReservation, onBookingSuccess, collapsibleContent}) {
    const {dayStart, dayEnd} = useSettings();
    const [provisional, setProvisional] = useState(null);
    const [pendingReservation, setPendingReservation] = useState(null);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const longTimer = useRef(null);
    const dragRef = useRef(false);
    const gridRef = useRef(null);
    const pointerStart = useRef(null);
    const lastClickRef = useRef({time: 0, uid: null});
    const scrollLockRef = useRef(null);

    /** Next 7 days starting from today */
    const dayItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Array.from({length: 7}, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return d;
        });
    }, []);

    /** Formats a Date into "YYYY-MM-DD" */
    const fmtDateKey = useCallback((d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    /** Day label: Aujourd'hui, Demain, Après-demain, or short weekday */
    const getDayLabel = useCallback((d) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.round((d - today) / 86400000);
        if (diff === 0) return "Aujourd'hui";
        if (diff === 1) return "Demain";
        if (diff === 2) return "Après-demain";
        return d.toLocaleDateString("fr-FR", {weekday: "short"});
    }, []);

    /**
     * Starts a 500ms timer on pointer down. If the timer fires (no significant movement),
     * creates the purple provisional block and locks scroll.
     */
    const handlePointerDown = useCallback((e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerStart.current = {x: e.clientX, y: e.clientY};

        setPendingReservation(null);
        longTimer.current = setTimeout(() => {
            const rect = gridRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            let startDec = snap((y - PAD_T - ROW_H / 2) / ROW_H + dayStart);
            startDec = Math.max(dayStart, Math.min(dayEnd - 1, startDec));

            dragRef.current = true;
            setProvisional({startDec});
            longTimer.current = null;

            // Lock scroll by preventing touch/wheel events on the viewport
            const viewport = gridRef.current?.parentElement;
            if (viewport) {
                scrollLockRef.current = {
                    scrollTop: viewport.scrollTop,
                    handler: (ev) => ev.preventDefault(),
                };
                viewport.addEventListener("touchmove", scrollLockRef.current.handler, {passive: false});
                viewport.addEventListener("wheel", scrollLockRef.current.handler, {passive: false});
            }
            // Prevent text selection while dragging
            document.body.style.userSelect = "none";
            document.body.style.webkitUserSelect = "none";
        }, 500);
    }, [dayStart, dayEnd]);

    /**
     * Cancels the long-press timer if pointer moves >5px (scroll/pan).
     * If drag is active, updates the provisional block position.
     */
    const handlePointerMove = useCallback((e) => {
        if (longTimer.current) {
            const dx = Math.abs(e.clientX - pointerStart.current.x);
            const dy = Math.abs(e.clientY - pointerStart.current.y);
            if (dx > 5 || dy > 5) {
                clearTimeout(longTimer.current);
                longTimer.current = null;
            }
            return;
        }

        if (!dragRef.current) return;

        const rect = gridRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        let startDec = snap((y - PAD_T - ROW_H / 2) / ROW_H + dayStart);
        startDec = Math.max(dayStart, Math.min(dayEnd - 1, startDec));
        setProvisional(prev => prev ? {...prev, startDec} : null);
    }, [dayStart, dayEnd]);

    /**
     * On pointer up: if a drag was active, stores the time range and opens the booking form.
     * If timer is active, cancels it (simple tap, not a hold).
     */
    const handlePointerUp = useCallback(() => {
        // Unlock scroll on the viewport
        const viewport = gridRef.current?.parentElement;
        if (viewport && scrollLockRef.current) {
            viewport.removeEventListener("touchmove", scrollLockRef.current.handler);
            viewport.removeEventListener("wheel", scrollLockRef.current.handler);
            viewport.scrollTop = scrollLockRef.current.scrollTop;
            scrollLockRef.current = null;
        }
        // Restore text selection
        document.body.style.userSelect = "";
        document.body.style.webkitUserSelect = "";

        if (longTimer.current) {
            clearTimeout(longTimer.current);
            longTimer.current = null;
            return;
        }

        if (dragRef.current && provisional) {
            const dateStr = fmtDateKey(selectedDate);
            const endDec = provisional.startDec + 1;
            const startHour = fmtHHMM(provisional.startDec);
            const endHour = fmtHHMM(endDec);

            setPendingReservation({date: selectedDate, dateStr, startHour, endHour});
            onNewReservation?.(dateStr, startHour, endHour);

            dragRef.current = false;
            setProvisional(null);
        }
    }, [provisional, onNewReservation, selectedDate, fmtDateKey]);

    /* Filter reservations for the selected date, within operating hours, sorted */
    const dayStartDate = useMemo(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), dayStart, 0, 0), [selectedDate, dayStart]);
    const dayEndDate = useMemo(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), dayEnd, 0, 0), [selectedDate, dayEnd]);
    const sorted = useMemo(() => {
        const upcoming = reservations.filter((r) => new Date(r.end) > dayStartDate && new Date(r.start) < dayEndDate);
        return upcoming.sort((a, b) => a.start.localeCompare(b.start));
    }, [reservations, dayStartDate, dayEndDate]);

    return (
        <Box h="90%" w="100%" bg="bg.secondary" position="relative">
            {/* Day selector */}
            <Flex justify="center" gap={2} py={3} px={2} bg="bg.secondary" borderBottom="1px solid" borderColor="whiteAlpha.200">
                {dayItems.map((d) => {
                    const isSelected = fmtDateKey(d) === fmtDateKey(selectedDate);
                    const isToday = fmtDateKey(d) === fmtDateKey(new Date());
                    return (
                        <Box
                            key={fmtDateKey(d)}
                            as="button"
                            onClick={() => { setSelectedDate(d); setPendingReservation(null); }}
                            display="flex"
                            flexDir="column"
                            align="center"
                            justify="center"
                            w="90px"
                            py={2}
                            borderRadius="md"
                            cursor="pointer"
                            position="relative"
                            bg={isSelected ? "accent.default" : "transparent"}
                            color={isSelected ? "white" : isToday ? "accent.default" : "text.secondary"}
                            fontWeight={isSelected ? "bold" : "medium"}
                            fontSize="sm"
                            transition="all 0.15s"
                            _hover={!isSelected ? {bg: "whiteAlpha.100"} : undefined}
                        >
                            <Text fontSize="xs" lineHeight={1.2}>{getDayLabel(d)}</Text>
                            <Text fontSize="2xs" color={isSelected ? "whiteAlpha.800" : "text.muted"}>{d.getDate()}/{d.getMonth() + 1}</Text>
                        </Box>
                    );
                })}
            </Flex>

            <BgCalendar
                dayStart={dayStart}
                dayEnd={dayEnd}
                isToday={fmtDateKey(selectedDate) === fmtDateKey(new Date())}
                gridRef={gridRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {/* Existing reservation blocks */}
                {sorted.map(r => {
                    const s = r.start.slice(11, 16);
                    const e = r.end.slice(11, 16);
                    return (
                        <Reservation key={r.uid} startHour={s} endHour={e} color="blue.500"
                                     style={{cursor: onDeleteReservation ? "pointer" : undefined}}
                                     onClick={() => {
                                         if (!onDeleteReservation) return;
                                         const now = Date.now();
                                         const prev = lastClickRef.current;
                                         if (prev.uid === r.uid && now - prev.time < DBL_CLICK_DELAY) {
                                             lastClickRef.current = {time: 0, uid: null};
                                             onDeleteReservation(r);
                                         } else {
                                             lastClickRef.current = {time: now, uid: r.uid};
                                         }
                                     }}>
                            <Text fontSize="xs" color="white" fontWeight="semibold" noOfLines={1}>
                                {r.title}
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.800">
                                {s} – {e} · {r.reserved_by}
                            </Text>
                        </Reservation>
                    );
                })}

                {/* Provisional block (long-press drag preview) */}
                {provisional && (() => {
                    const endDec = provisional.startDec + 1;
                    const sh = fmtHHMM(provisional.startDec);
                    const eh = fmtHHMM(endDec);
                    return (
                        <Reservation key="__provisional" startHour={sh} endHour={eh} color="purple.500"
                                     animation={`${bumpIn} 0.2s ease-out`}
                                     transformOrigin="top center"

                        >
                            <Text fontSize="xs" color="white" fontWeight="semibold" noOfLines={1}>
                                Nouvelle réservation
                            </Text>
                            <Text fontSize="xs" color="whiteAlpha.800">
                                {sh} – {eh}
                            </Text>
                        </Reservation>
                    );
                })()}

                {/* Pending reservation block (kept after release while form is open) */}
                {pendingReservation && !provisional && (
                    <Reservation
                        key="__pending"
                        startHour={pendingReservation.startHour}
                        endHour={pendingReservation.endHour}
                        color="purple.500"
                        animation={`${bumpIn} 0.2s ease-out`}
                        transformOrigin="top center"
                    >
                        <Text fontSize="xs" color="white" fontWeight="semibold" noOfLines={1}>
                            Nouvelle réservation
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.800">
                            {pendingReservation.startHour} – {pendingReservation.endHour}
                        </Text>
                    </Reservation>
                )}
            </BgCalendar>

            {/* Booking form overlay — fixed at bottom, scrollable */}
            {pendingReservation && roomName && (
                <Box
                    position="absolute"
                    bottom="-10"
                    left="65px"
                    right="5px"
                    maxH="75%"
                    overflowY="auto"
                    zIndex={20}
                    bg="rgba(17, 21, 34, 0.95)"
                    borderTopRadius="md"
                    boxShadow="lg"
                    p={3}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Collapsible.Root open={true} unmountOnExit>
                        <Collapsible.Content>
                            {collapsibleContent
                                ? (typeof collapsibleContent === "function"
                                    ? collapsibleContent({
                                        pendingReservation,
                                        onTimeChange: (h, m, eh, em) => {
                                            const startHour = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                                            const endHour = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                                            setPendingReservation(prev => prev ? {...prev, startHour, endHour} : prev);
                                        },
                                        onSuccess: (reservation) => {
                                            setPendingReservation(null);
                                            onBookingSuccess?.(reservation);
                                        },
                                        onCancel: () => setPendingReservation(null),
                                      })
                                    : collapsibleContent)
                                : (
                                    <BookingForm
                                        roomName={roomName}
                                        existingReservations={existingReservations}
                                        defaultDate={pendingReservation.date}
                                        defaultHour={parseInt(pendingReservation.startHour.split(":")[0], 10)}
                                        defaultMinute={parseInt(pendingReservation.startHour.split(":")[1], 10)}
                                        onTimeChange={(h, m, eh, em) => {
                                            const startHour = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                                            const endHour = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                                            setPendingReservation(prev => prev ? {...prev, startHour, endHour} : prev);
                                        }}
                                        onSuccess={(reservation) => {
                                            setPendingReservation(null);
                                            onBookingSuccess?.(reservation);
                                        }}
                                        onCancel={() => setPendingReservation(null)}
                                    />
                                )}
                        </Collapsible.Content>
                    </Collapsible.Root>
                </Box>
            )}
        </Box>
    );
}
