import { useState } from "react";
import { Box, Flex, Input, Button, Text } from "@chakra-ui/react";
import { createReservation } from "../../api/apiCall.js";

/**
 * Booking form with date, time, duration, title, and name fields.
 * Computes end datetime from start + duration, validates client-side,
 * checks for overlaps, and calls createReservation API.
 * @param {Object} props
 * @param {string} roomName Target room name
 * @param {Array} existingReservations Existing reservations for overlap check
 * @param {Function} onSuccess Called with new reservation on success
 * @param {Function} onCancel Called when user cancels
 * @return {JSX.Element} BookingForm component
 */
export function BookingForm({ roomName, existingReservations = [], onSuccess, onCancel }) {
  const today = new Date().toISOString().slice(0, 10);

  const now = new Date();
  const roundedMin = Math.ceil(now.getMinutes() / 5) * 5;
  now.setMinutes(roundedMin, 0, 0);
  const defaultTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState(defaultTime);
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState("");
  const [reservedBy, setReservedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Formats a date and time string into a single datetime string.
   * @param {string} dateStr Date in YYYY-MM-DD format
   * @param {string} timeStr Time in HH:mm format
   * @returns {string} Combined datetime string
   */
  function formatDatetime(dateStr, timeStr) {
    return `${dateStr} ${timeStr}`;
  }

  /**
   * Computes the end datetime given a start date, time, and duration.
   * @param {string} dateStr Date in YYYY-MM-DD format
   * @param {string} timeStr Start time in HH:mm format
   * @param {number} dur Duration in minutes
   * @returns {string} End datetime string
   */
  function computeEnd(dateStr, timeStr, dur) {
    const [h, m] = timeStr.split(":");
    const startDt = new Date(dateStr);
    startDt.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    const endDt = new Date(startDt.getTime() + dur * 60000);
    const endDate = endDt.toISOString().slice(0, 10);
    const endTime = `${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}`;
    return formatDatetime(endDate, endTime);
  }

  /**
   * Checks whether the given time range overlaps any existing reservation.
   * @param {string} start Start datetime string
   * @param {string} end End datetime string
   * @returns {boolean} True if overlapping
   */
  function hasOverlap(start, end) {
    const s = new Date(start.replace(" ", "T"));
    const e = new Date(end.replace(" ", "T"));
    return existingReservations.some((r) => {
      const rs = new Date(r.start.replace(" ", "T"));
      const re = new Date(r.end.replace(" ", "T"));
      return s < re && e > rs;
    });
  }

  /**
   * Checks whether the given start datetime is in the past.
   * @param {string} start Start datetime string
   * @returns {boolean} True if the start time is in the past
   */
  function isInPast(start) {
    return new Date(start.replace(" ", "T")) < new Date();
  }

  /**
   * Validates form fields, checks for overlaps and past dates, then calls the API.
   * @returns {Promise<void>}
   */
  async function handleSubmit() {
    setError("");

    if (!date || !startTime || !title || !reservedBy) {
      setError("Tous les champs sont requis.");
      return;
    }

    if (duration < 5) {
      setError("La durée minimum est de 5 minutes.");
      return;
    }

    const start = formatDatetime(date, startTime);
    const end = computeEnd(date, startTime, duration);

    if (end <= start) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    if (isInPast(start)) {
      setError("Impossible de réserver dans le passé.");
      return;
    }

    if (hasOverlap(start, end)) {
      setError("Cette plage horaire chevauche une réservation existante.");
      return;
    }

    setLoading(true);
    try {
      const result = await createReservation(roomName, {
        start,
        end,
        title,
        reserved_by: reservedBy,
      });
      onSuccess?.(result.reservation);
    } catch (err) {
      setError(err.message || "Erreur lors de la création.");
    }
    setLoading(false);
  }

  /**
   * Submits the form when the Enter key is pressed.
   * @param {React.KeyboardEvent} e Keyboard event
   */
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Box onKeyDown={handleKeyDown}>
      <Flex direction="column" gap={3}>
        <Text fontSize="sm" fontWeight="medium" color="text.primary">
          Nouvelle réservation · {roomName}
        </Text>

        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Date</Text>
          <Input
            type="date"
            size="sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            min={today}
          />
        </Box>

        <Flex gap={2}>
          <Box flex={1}>
            <Text fontSize="xs" color="text.muted" mb={1}>Début</Text>
            <Input
              type="time"
              size="sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              bg="bg.primary"
              borderColor="border.default"
              color="text.primary"
              _focus={{ borderColor: "accent.default" }}
            />
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="text.muted" mb={1}>Durée (min)</Text>
            <Input
              type="number"
              size="sm"
              value={duration}
              onChange={(e) => setDuration(Math.max(5, parseInt(e.target.value, 10) || 5))}
              bg="bg.primary"
              borderColor="border.default"
              color="text.primary"
              _focus={{ borderColor: "accent.default" }}
              min={5}
              step={5}
            />
          </Box>
        </Flex>

        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Titre</Text>
          <Input
            size="sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Stand-up"
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            autoFocus
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Réservé par</Text>
          <Input
            size="sm"
            value={reservedBy}
            onChange={(e) => setReservedBy(e.target.value)}
            placeholder="Votre nom"
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
          />
        </Box>

        {error && (
          <Text fontSize="sm" color="#f87171">
            {error}
          </Text>
        )}

        <Flex gap={2} mt={1}>
          <Button
            size="sm"
            variant="ghost"
            color="text.secondary"
            _hover={{ color: "text.primary", bg: "bg.secondary" }}
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            bg="accent.default"
            color="white"
            _hover={{ bg: "accent.hover" }}
            isLoading={loading}
            onClick={handleSubmit}
          >
            Réserver
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
