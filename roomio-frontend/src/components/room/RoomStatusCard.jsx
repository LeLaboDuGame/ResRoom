import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { Clock } from "../ui/Clock";
import { StatusBadge } from "../ui/StatusBadge";
import { MeetingProgress } from "./MeetingProgress";

/**
 * Room status card with photo, overlay, booking button, and meeting progress.
 * @param {Object} room Room object
 * @param {Function} onBook Click handler for booking
 * @return {JSX.Element} RoomStatusCard component
 */
export function RoomStatusCard({ room, onBook }) {
  const [photoError, setPhotoError] = useState(false);
  const el = room?.elements || {};
  const roomName = room?.name || "";
  const photoUrl = "/src/assets/rooms/" + encodeURIComponent(roomName) + ".jpeg";

  const now = new Date();
  const activeRes = (room?.reservations || []).find((r) => {
    const s = new Date(r.start.replace(" ", "T"));
    const e = new Date(r.end.replace(" ", "T"));
    return now >= s && now < e;
  });

  return (
    <Box
      borderRadius="xl"
      overflow="hidden"
      bg="bg.secondary"
      position="relative"
      minH="280px"
      display="flex"
      flexDirection="column"
    >
      {/* Photo or gradient fallback */}
      <Box position="relative" h="160px" bg="bg.elevated">
        {!photoError && (
          <Box
            as="img"
            src={photoUrl}
            alt={room?.name}
            w="100%"
            h="100%"
            objectFit="cover"
            onError={() => setPhotoError(true)}
          />
        )}
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-t, rgba(0,0,0,0.7), transparent)"
        />
      </Box>

      {/* Content */}
      <Box p={4} flex={1} display="flex" flexDirection="column" gap={3}>
        {/* Top row: clock + status */}
        <Flex align="center" justify="space-between">
          <Clock />
          <StatusBadge status={room?.status || "free"} />
        </Flex>

        {/* Room name */}
        <Text fontSize="xl" fontWeight="bold" color="text.primary">
          {room?.name}
        </Text>

        {/* Bottom section */}
        <Flex align="center" justify="space-between" mt="auto">
          {activeRes ? (
            <MeetingProgress start={activeRes.start} end={activeRes.end} size={80} />
          ) : (
            <Box />
          )}
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
            _hover={{ bg: "rgba(79,140,255,0.25)" }}
            onClick={onBook}
            aria-label="Book this room"
          >
            <Plus size={24} />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
