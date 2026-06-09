import { Box, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useRoom } from "../hooks/useRooms";

/**
 * Dedicated tablet room page (/fleet/:roomName).
 * Displays room information with automatic polling.
 * @return {JSX.Element} FleetRoom page
 */
export default function FleetRoom() {
  const { roomName } = useParams();
  const { room, loading, error } = useRoom(roomName);

  if (loading) return (
    <Box minH="100vh" bg="#0a0a0b" color="#f5f5f7" display="flex" alignItems="center" justifyContent="center">
      <Text fontSize="xl">Loading...</Text>
    </Box>
  );

  if (error) return (
    <Box minH="100vh" bg="#0a0a0b" color="#f5f5f7" display="flex" alignItems="center" justifyContent="center">
      <Text fontSize="xl" color="red.400">Error: {error}</Text>
    </Box>
  );

  return (
    <Box minH="100vh" bg="#0a0a0b" color="#f5f5f7" display="flex" alignItems="center" justifyContent="center" flexDir="column">
      <Text fontSize="2xl" fontWeight="bold">Room: {roomName}</Text>
      <Box as="pre" fontSize="sm" mt={4} p={4} bg="#1a1a1e" borderRadius="md">
        {JSON.stringify(room, null, 2)}
      </Box>
    </Box>
  );
}
