import { Box, Flex, Text } from "@chakra-ui/react";
import { Monitor, ClipboardList, Computer, Users, MapPin } from "lucide-react";

/**
 * Room metadata panel: name, capacity, equipment with Lucide icons.
 * @param {Object} room Room object with elements
 * @return {JSX.Element} RoomInfoPanel component
 */
export function RoomInfoPanel({ room }) {
  const el = room?.elements || {};

  const items = [
    { icon: Users, label: `${el.capacity || "?"} people` },
    { icon: Monitor, label: "TV", active: el.tv },
    { icon: ClipboardList, label: "Whiteboard", active: el.whiteboard },
    { icon: Computer, label: "Computer", active: el.computer },
  ];

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={1}>
        {room?.name}
      </Text>

      <Flex direction="column" gap={2}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.active;
          return (
            <Flex key={item.label} align="center" gap={2} opacity={active === false ? 0.35 : 1}>
              <Box as="span" color="text.secondary" w={4} display="flex" alignItems="center">
                <Icon size={16} />
              </Box>
              <Text fontSize="sm" color="text.secondary">
                {item.label}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
}
