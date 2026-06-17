import {useState} from "react";
import {Box, Flex, Text} from "@chakra-ui/react";
import {Plus} from "lucide-react";
import {Clock} from "../ui/Clock";
import {StatusBadge} from "../ui/StatusBadge";
import {MeetingProgress} from "./MeetingProgress";


const statusColors = {
  free: "status.free",
  startingSoon: "status.startingSoon",
  meeting: "status.meeting",
  finishingSoon: "status.finishingSoon",
};


/**
 * Room status card with photo, status overlay, booking button and meeting progress.
 * @param {Object} room Room object with name, elements and reservations
 * @param {Function} [onBook] Click handler for the book button
 * @param {boolean} [activateReservationButton=true] Whether to show the booking button
 * @returns {JSX.Element} The rendered room status card
 */
export function RoomStatusCard({room, onBook, activateReservationButton = true}) {
    const [photoError, setPhotoError] = useState(false);
    const el = room?.elements || {};
    const roomName = room?.name || "";
    const photoUrl = "/rooms/" + encodeURIComponent(roomName) + ".jpeg";

    const now = new Date();
    const reservations = room?.reservations || [];

    const parseDate = (d) => new Date(d.replace(" ", "T"));

    const activeRes = reservations.find((r) => {
        const s = parseDate(r.start);
        const e = parseDate(r.end);
        return now >= s && now < e;
    });

    const nextRes = reservations
        .filter((r) => parseDate(r.start) > now && (!activeRes || parseDate(r.start) >= parseDate(activeRes.end)))
        .sort((a, b) => parseDate(a.start) - parseDate(b.start))[0];

    let derivedStatus = "free";
    if (activeRes) {
        const endDt = parseDate(activeRes.end);
        derivedStatus = (endDt - now) <= 15 * 60 * 1000 ? "finishingSoon" : "meeting";
    } else if (nextRes && (parseDate(nextRes.start) - now) <= 15 * 60 * 1000) {
        derivedStatus = "startingSoon";
    }

    const fmtTime = (d) => d.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"});

    return (
        <Box
            borderRadius="xl"
            overflow="hidden"
            bg="bg.secondary"
            position="relative"
            flex={1}
            display="flex"
            flexDirection="column"
            minH="280px"
            shadow={"0 0 25px  5px var(--shadow-color)"}
            shadowColor={statusColors[derivedStatus]}
        >
            {/* Photo 3/4 of card height */}
            <Box position="relative" flex={3} bg="bg.elevated" overflow="hidden" minH="0">
                {photoError ? (
                    <Flex w="100%" h="100%" align="center" justify="center" bg="bg.secondary">
                        <Text color="text.muted" fontSize="sm">{roomName}</Text>
                    </Flex>
                ) : (
                    <img
                        src={photoUrl}
                        alt={room?.name}
                        style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}}
                        onError={() => setPhotoError(true)}
                    />
                )}
                <Box
                    position="absolute"
                    inset={0}
                    pointerEvents="none"
                    bgGradient="linear(to-t, rgba(0,0,0,0.7), transparent 40%)"
                />
            </Box>

            {/* Content */}
            <Box p={4} flex={1} display="flex" flexDirection="column" gap={3}>
                {/* Top row: clock + status */}
                <Flex align="center" justify="space-between">
                    <Clock/>
                    <StatusBadge status={derivedStatus} isDot={false}/>
                </Flex>

                {/* Room name */}
                <Text fontSize="xl" fontWeight="bold" color="text.primary">
                    {room?.name}
                </Text>

                {/* Next reservation */}
                {nextRes && (
                    <Box>
                        <Text color="text.primary" fontSize="sm">Prochaine réservation:</Text>
                        <Box bg="bg.elevated" borderRadius="md" px={3} py={2} mt={1}>
                            <Flex align="center" justify="space-between">
                                <Text fontSize="xs" color="text.muted">
                                    {fmtTime(parseDate(nextRes.start))} - {fmtTime(parseDate(nextRes.end))}
                                </Text>
                                <Text fontSize="xs" color="text.muted" noOfLines={1}>{nextRes.reserved_by}</Text>
                            </Flex>
                            <Text fontSize="sm" color="text.primary" fontWeight="medium" noOfLines={1}>
                                {nextRes.title}
                            </Text>
                        </Box>
                    </Box>
                )}

                {/* Bottom section */}
                <Flex align="center" justify="space-between" mt="auto">
                    {activeRes ? (
                        <MeetingProgress start={activeRes.start} end={activeRes.end} size={80}/>
                    ) : (
                        <Box/>
                    )}
                    {activateReservationButton && (
                        <Box
                            as="button"
                            w={12}
                            h={12}
                            borderRadius="full"
                            bg="rgba(79,140,255,0.15)"
                            color="accent.default"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            cursor="pointer"
                            _hover={{bg: "rgba(79,140,255,0.25)"}}
                            onClick={onBook}
                            aria-label="Book this room"
                        >
                            <Plus size={24}/>
                        </Box>
                    )}
                </Flex>
            </Box>
        </Box>
    );
}
