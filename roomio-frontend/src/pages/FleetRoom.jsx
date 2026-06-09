import { Box, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

export default function FleetRoom() {
  const { roomName } = useParams();
  return (
    <Box minH="100vh" bg="#0a0a0b" color="#f5f5f7" display="flex" alignItems="center" justifyContent="center">
      <Text fontSize="2xl" fontWeight="bold">Salle : {roomName}</Text>
    </Box>
  );
}
