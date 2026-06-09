import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { X } from "lucide-react";

const getDayLabel = (dateStr) => {
  const d = new Date(dateStr.replace(" ", "T"));
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((d - todayStart) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === 2) return "Après-demain";

  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

const getDateKey = (dateStr) => dateStr?.slice(0, 10);

const fmtHm = (dateStr) => {
  const d = new Date(dateStr.replace(" ", "T"));
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

/**
 * Vertical list of reservations grouped by day with separators.
 * @param {Array} reservations Array of reservation objects
 * @param {Function} onDelete Callback with reservation uid
 * @return {JSX.Element} ReservationList component
 */
export function ReservationList({ reservations = [], onDelete }) {
  const sorted = [...reservations].sort((a, b) => a.start.localeCompare(b.start));

  const grouped = {};
  for (const r of sorted) {
    const key = getDateKey(r.start);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  if (!sorted.length) {
    return (
      <Text fontSize="sm" color="text.muted" textAlign="center" py={6}>
        Aucune réservation
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
      {Object.entries(grouped).map(([dateKey, dayRes], groupIdx) => (
        <Box key={dateKey}>
          {groupIdx > 0 && <Box h="1px" bg="border.default" my={2} mx={3} />}
          <Text fontSize="xs" fontWeight="bold" color="text.secondary" px={3} py={1.5} textTransform="capitalize">
            {getDayLabel(dayRes[0].start)}
          </Text>
          {dayRes.map((r) => (
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
                  {fmtHm(r.start)} – {fmtHm(r.end)} · {r.reserved_by}
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
      ))}
    </Box>
  );
}
