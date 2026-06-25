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
                        touchAction="pan-y"
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
 * @param {Function} [onNewReservation] Called with {date, dateStr, startHour, endHour} on provisional release
 * @param {string} [roomName] Room name (enables collapsible booking form)
 * @param {Array} [existingReservations] Existing reservations for overlap check
 * @param {Function} [onDeleteReservation] Called with reservation object on double-click
 * @param {Function} [onBookingSuccess] Called with new reservation after successful booking
 * @param {boolean} [modalForm=false] Render the booking form as a centered modal overlay
 * @returns {JSX.Element} Calendar component
 */
export function Calendar({reservations = [], onNewReservation, roomName, existingReservations = [], onDeleteReservation, onBookingSuccess, collapsibleContent, modalForm = false, pendingTimeRange, splitDays = 1}) {
    const {dayStart, dayEnd} = useSettings();
    const [provisional, setProvisional] = useState(null);
    const [pendingReservation, setPendingReservation] = useState(null);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [weekOffset, setWeekOffset] = useState(0);

    const longTimer = useRef(null);
    const dragRef = useRef(false);
    const gridRef = useRef(null);
    const pointerStart = useRef(null);
    const lastClickRef = useRef({time: 0, uid: null});
    const scrollLockRef = useRef(null);
    const swipeDayRef = useRef(null);
    const swipeGridRef = useRef(null);

    /** Array of consecutive days to display starting from selectedDate */
    const dayRange = useMemo(() => {
        const days = [];
        for (let i = 0; i < splitDays; i++) {
            const d = new Date(selectedDate);
            d.setDate(selectedDate.getDate() + i);
            days.push(d);
        }
        return days;
    }, [selectedDate, splitDays]);

    /** Mon-Sat of the week at weekOffset */
    const dayItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dow = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((dow + 6) % 7) + weekOffset * 7);
        return Array.from({length: 7}, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }, [weekOffset]);

    const dayLetters = ["Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat.", "Fry."];

    /** Formats a Date into "YYYY-MM-DD" */
    const fmtDateKey = useCallback((d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }, []);

    /**
     * Starts a 500ms timer on pointer down. If the timer fires (no significant movement),
     * creates the purple provisional block and locks scroll.
     */
    const handlePointerDown = useCallback((e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerStart.current = {x: e.clientX, y: e.clientY};
        swipeGridRef.current = {startX: e.clientX, startY: e.clientY, handled: false};

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
    const handlePointerUp = useCallback((e) => {
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

            const reservationData = {date: selectedDate, dateStr, startHour, endHour};
            setPendingReservation(reservationData);
            onNewReservation?.(reservationData);

            dragRef.current = false;
            setProvisional(null);
            return;
        }

        // Horizontal swipe on grid → change selected day
        const sw = swipeGridRef.current;
        if (sw && !sw.handled) {
            const dx = e.clientX - sw.startX;
            const dy = e.clientY - sw.startY;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                sw.handled = true;
                const next = new Date(selectedDate);
                next.setDate(selectedDate.getDate() + (dx > 0 ? -1 : 1));
                setSelectedDate(next);
                // sync weekOffset so day selector follows
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const refMonday = new Date(today);
                refMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
                const nd = next.getDay();
                const newMonday = new Date(next);
                newMonday.setDate(next.getDate() - ((nd + 6) % 7));
                setWeekOffset(Math.round((newMonday - refMonday) / 604800000));
            }
        }
        swipeGridRef.current = null;
    }, [provisional, onNewReservation, selectedDate, fmtDateKey]);

    const handleDaySwipeStart = useCallback((e) => {
        swipeDayRef.current = e.clientX;
    }, []);

    const handleDaySwipeEnd = useCallback((e) => {
        if (swipeDayRef.current === null) return;
        const dx = e.clientX - swipeDayRef.current;
        swipeDayRef.current = null;
        if (dx > 40) setWeekOffset((o) => o - 1);
        else if (dx < -40) setWeekOffset((o) => o + 1);
    }, []);

    return (
        <Box h="90%" w="100%" bg="bg.secondary" position="relative">
            {/* Day selector */}
            <Flex justify="center" gap={2} py={3} px={2} bg="bg.secondary" borderBottom="1px solid" borderColor="whiteAlpha.200"
                  onPointerDown={handleDaySwipeStart} onPointerUp={handleDaySwipeEnd}>
                {dayItems.map((d, i) => {
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
                            bg={isSelected ? (isToday ? "red.500" : "accent.default") : "transparent"}
                            color={isSelected ? "white" : "text.secondary"}
                            fontWeight={isSelected ? "bold" : "medium"}
                            fontSize="sm"
                            transition="all 0.15s"
                            _hover={!isSelected ? {bg: "whiteAlpha.100"} : undefined}
                        >
                            <Text fontSize="md" lineHeight={1.3} fontWeight="semibold" color={!isSelected && isToday ? "red.400" : undefined}>{dayLetters[i]}</Text>
                            <Text fontSize="xs" color={isSelected ? "whiteAlpha.800" : "text.muted"}>{d.getDate()}/{d.getMonth() + 1}</Text>
                        </Box>
                    );
                })}
            </Flex>

            <Flex direction="row" w="100%" flex={1} overflow="hidden">
                {dayRange.map((d, idx) => {
                    const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate(), dayStart, 0, 0);
                    const de = new Date(d.getFullYear(), d.getMonth(), d.getDate(), dayEnd, 0, 0);
                    const dayReservations = reservations
                        .filter((r) => new Date(r.end) > ds && new Date(r.start) < de)
                        .sort((a, b) => a.start.localeCompare(b.start));
                    const isPrimary = idx === 0;

                    return (
                        <Box key={d.toISOString()} flex={1} minW="0" position="relative"
                             borderRight={idx < dayRange.length - 1 ? "1px solid" : undefined}
                             borderColor="whiteAlpha.200">
                            {/* Day column header */}
                            <Text textAlign="center" fontSize="xs" color="text.secondary" py={1}
                                  bg="bg.secondary" borderBottom="1px solid" borderColor="whiteAlpha.100">
                                {dayLetters[(d.getDay() + 6) % 7]} {d.getDate()}/{d.getMonth() + 1}
                            </Text>

                            <BgCalendar
                                dayStart={dayStart}
                                dayEnd={dayEnd}
                                isToday={fmtDateKey(d) === fmtDateKey(new Date())}
                                gridRef={isPrimary ? gridRef : undefined}
                                onPointerDown={isPrimary ? handlePointerDown : undefined}
                                onPointerMove={isPrimary ? handlePointerMove : undefined}
                                onPointerUp={isPrimary ? handlePointerUp : undefined}
                            >
                                {/* Reservation blocks for this day */}
                                {dayReservations.map(r => {
                                    const rStart = new Date(r.start.replace(" ", "T"));
                                    const rEnd = new Date(r.end.replace(" ", "T"));
                                    const clipStart = new Date(Math.max(rStart.getTime(), ds.getTime()));
                                    const clipEnd = new Date(Math.min(rEnd.getTime(), de.getTime()));
                                    const s = `${String(clipStart.getHours()).padStart(2, "0")}:${String(clipStart.getMinutes()).padStart(2, "0")}`;
                                    const e = `${String(clipEnd.getHours()).padStart(2, "0")}:${String(clipEnd.getMinutes()).padStart(2, "0")}`;
                                    const multiDay = rStart.toDateString() !== rEnd.toDateString();
                                    const isStartDay = rStart.toDateString() === d.toDateString();
                                    const isEndDay = rEnd.toDateString() === d.toDateString();
                                    const label = multiDay
                                        ? isStartDay ? `${s} – ${e} → +1` : isEndDay ? `← ${s} – ${e}` : `↔`
                                        : `${s} – ${e}`;
                                    return (
                                        <Reservation key={r.uid} startHour={s} endHour={e} color="blue.500"
                                                     style={{
                                                         cursor: onDeleteReservation ? "pointer" : undefined,
                                                         borderLeft: multiDay ? "3px solid #fbbf24" : undefined,
                                                     }}
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
                                                {label} · {r.reserved_by}
                                            </Text>
                                        </Reservation>
                                    );
                                })}

                                {/* Provisional block — only on primary day */}
                                {provisional && isPrimary && (() => {
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

                                {/* Pending reservation block — only on primary day */}
                                {pendingReservation && !provisional && isPrimary && (
                                    <Reservation
                                        key="__pending"
                                        startHour={pendingTimeRange?.startHour || pendingReservation.startHour}
                                        endHour={pendingTimeRange?.endHour || pendingReservation.endHour}
                                        color="purple.500"
                                        animation={`${bumpIn} 0.2s ease-out`}
                                        transformOrigin="top center"
                                    >
                                        <Text fontSize="xs" color="white" fontWeight="semibold" noOfLines={1}>
                                            Nouvelle réservation
                                        </Text>
                                        <Text fontSize="xs" color="whiteAlpha.800">
                                            {pendingTimeRange?.startHour || pendingReservation.startHour} – {pendingTimeRange?.endHour || pendingReservation.endHour}
                                        </Text>
                                    </Reservation>
                                )}
                            </BgCalendar>
                        </Box>
                    );
                })}
            </Flex>

            {/* Today button */}
            <Box
                as="button"
                position="absolute"
                bottom="-10%"
                left="10%"
                zIndex={10}
                width="100px"
                bg="blue.700/30"
                color="white"
                fontWeight="semibold"
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="50px"
                _hover={{ bg: "blue.400"}}
                onClick={() => {
                    setWeekOffset(0);
                    const d = new Date();
                    d.setHours(0, 0, 0, 0);
                    setSelectedDate(d);
                    // scroll to current hour
                    const viewport = gridRef.current?.parentElement;
                    if (viewport) {
                        const curHour = new Date().getHours() + new Date().getMinutes() / 60;
                        const scrollTo = PAD_T + (curHour - dayStart) * ROW_H + ROW_H / 2 - 100;
                        viewport.scrollTop = Math.max(0, scrollTo);
                    }
                }}
            >
                Today
            </Box>

            {/* Booking form overlay — modal or bottom-anchored */}
            {pendingReservation && roomName && (modalForm ? (
                <Box
                    position="fixed"
                    inset={0}
                    bg="rgba(0,0,0,0.6)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={9999}
                    onPointerDown={() => { setPendingReservation(null); }}
                >
                    <Box
                        bg="rgba(17, 21, 34, 0.95)"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="border.default"
                        p={6}
                        w="90%"
                        maxW="420px"
                        maxH="85vh"
                        overflowY="auto"
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
                </Box>
            ) : (
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
            ))}
        </Box>
    );
}
