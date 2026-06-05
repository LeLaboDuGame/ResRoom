import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { X } from "lucide-react";

/**
 * Vertical list of today's reservations with delete button.
 * @param {Array} reservations Array of reservation objects
 * @param {Function} onDelete Callback with reservation uid
 * @return {JSX.Element} ReservationList component
 */
export function ReservationList({ reservations = [], onDelete }) {
  if (!reservations.length) {
    return (
      <Text fontSize="sm" color="text.muted" textAlign="center" py={6}>
        No reservations today
      </Text>
    );
  }

  return (
    <Box
      maxH="100%"
      overflowY="auto"
      css={{
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { bg: "#2c2c30", borderRadius: "full" },
      }}
    >
      {reservations.map((r) => (
        <Flex
          key={r.uid}
          align="center"
          justify="space-between"
          px={3}
          py={2.5}
          borderBottom="1px solid"
          borderColor="border.default"
          gap={3}
        >
          <Box flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="medium" color="text.primary" truncate>
              {r.title}
            </Text>
            <Text fontSize="xs" color="text.muted">
              {r.start?.slice(-5)} – {r.end?.slice(-5)} · {r.reserved_by}
            </Text>
          </Box>
          <IconButton
            aria-label="Delete reservation"
            size="xs"
            variant="ghost"
            color="text.muted"
            _hover={{ color: "danger" }}
            onClick={() => onDelete?.(r.uid)}
          >
            <X size={14} />
          </IconButton>
        </Flex>
      ))}
    </Box>
  );
}
