import { Box, Flex, Text } from "@chakra-ui/react";
import { Monitor, ClipboardList, Computer, Users } from "lucide-react";

/**
 * Info panel for a selected room showing its status and details.
 * @param {Object} room Room data with name and elements
 * @param {boolean} [horizontal=false] Display items in a row instead of column
 * @returns {JSX.Element} The room info panel
 */
export function RoomInfoPanel({ room, horizontal = false }) {
  const el = room?.elements || {};

  const items = [
    { icon: Users, label: `${el.capacity || "?"} people` },
    { icon: Monitor, label: "TV", active: el.tv },
    { icon: ClipboardList, label: "Whiteboard", active: el.whiteboard },
    { icon: Computer, label: "Computer", active: el.computer },
  ];

  return (
    <Box>
      {!horizontal && (
        <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={1}>
          {room?.name}
        </Text>
      )}
      <Flex direction={horizontal ? "row" : "column"} gap={horizontal ? 4 : 2} wrap={horizontal ? "wrap" : undefined}>
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
