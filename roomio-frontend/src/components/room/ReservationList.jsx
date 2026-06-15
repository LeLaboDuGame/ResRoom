import { useState } from "react";
import { Box, Flex, IconButton, Text, Input, Button } from "@chakra-ui/react";
import { X } from "lucide-react";

/**
 * Returns a French day label for a date string.
 * @param {string} dateStr Date string in "YYYY-MM-DD HH:mm" format
 * @returns {string} Localized day label ("Aujourd'hui", "Demain", "Après-demain", or a full date)
 */
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

/**
 * Extracts the date key (YYYY-MM-DD) from a datetime string.
 * @param {string} dateStr Date string in "YYYY-MM-DD HH:mm" format
 * @returns {string} Date portion only
 */
const getDateKey = (dateStr) => dateStr?.slice(0, 10);

/**
 * Formats a datetime string to HH:MM in French locale.
 * @param {string} dateStr Date string in "YYYY-MM-DD HH:mm" format
 * @returns {string} Formatted time string (e.g. "14:30")
 */
const fmtHm = (dateStr) => {
  const d = new Date(dateStr.replace(" ", "T"));
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

/**
 * Vertical list of upcoming reservations grouped by day with separators.
 * Supports delete with a confirmation flow.
 * @param {Array} [reservations=[]] Array of reservation objects with uid, start, end, title, reserved_by
 * @param {Function} [onDelete] Callback invoked with the reservation uid when deletion is confirmed
 * @returns {JSX.Element} The rendered reservation list
 */
export function ReservationList({ reservations = [], onDelete }) {
  const [confirmUid, setConfirmUid] = useState(null);
  const [confirmInput, setConfirmInput] = useState("");

  const now = new Date();
  const upcoming = reservations.filter((r) => new Date(r.end) > now);
  const sorted = [...upcoming].sort((a, b) => a.start.localeCompare(b.start));

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
          {dayRes.map((r) => {
            if (confirmUid === r.uid) {
              return (
                <Flex
                  key={r.uid}
                  align="center"
                  gap={2}
                  px={3}
                  py={2.5}
                  borderBottom="1px solid"
                  borderColor="border.default"
                >
                  <Input
                    size="xs"
                    placeholder='Tape "Oui" pour confirmer'
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    bg="bg.elevated"
                    borderColor="border.default"
                    color="text.primary"
                    _placeholder={{ color: "text.muted", fontSize: "xs" }}
                    flex={1}
                  />
                  <Button
                    size="xs"
                    colorScheme="red"
                    isDisabled={confirmInput !== "Oui"}
                    onClick={() => {
                      onDelete?.(r.uid);
                      setConfirmUid(null);
                      setConfirmInput("");
                    }}
                  >
                    Supprimer
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="text.muted"
                    onClick={() => {
                      setConfirmUid(null);
                      setConfirmInput("");
                    }}
                  >
                    Annuler
                  </Button>
                </Flex>
              );
            }

            return (
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
                  onClick={() => {
                    setConfirmUid(r.uid);
                    setConfirmInput("");
                  }}
                >
                  <X size={14} />
                </IconButton>
              </Flex>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
