import { useState } from "react";
import {
  Box, Flex, Input, Button, Text,
  DatePicker,
  SliderRoot,
  SliderTrack,
  SliderRange,
  SliderThumb,
  SliderValueText,
} from "@chakra-ui/react";
import { parseDate } from "@ark-ui/react/date-picker";
import { createReservation } from "../../api/apiCall.js";
import { useSettings } from "../../hooks/useSettings";

/**
 * Booking form with inline date picker calendar, hour/minute sliders,
 * title and duration fields. Calls createReservation API on submit
 * with overlap and past-date validation.
 * @param {Object} props
 * @param {string} roomName Target room name
 * @param {Array} existingReservations Existing reservations for overlap check
 * @param {Function} onSuccess Called with new reservation on success
 * @param {Function} onCancel Called when user cancels
 * @return {JSX.Element} BookingForm component
 */
export function BookingForm({ roomName, existingReservations = [], onSuccess, onCancel }) {
  const { dayStart, dayEnd } = useSettings();
  const today = new Date();

  const now = new Date();
  const roundedMin = Math.ceil(now.getMinutes() / 5) * 5;
  now.setMinutes(roundedMin, 0, 0);

  const defaultHour = Math.max(dayStart, Math.min(dayEnd - 1, now.getHours()));
  const defaultMin = now.getMinutes();

  const [dateValue, setDateValue] = useState([parseDate(today)]);
  const [hour, setHour] = useState(defaultHour);
  const [minute, setMinute] = useState(defaultMin);
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Formats date from DatePicker value + hour/minute into "YYYY-MM-DD HH:mm" */
  function formatDatetime() {
    const d = dateValue[0];
    if (!d) return "";
    const dateStr = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return `${dateStr} ${timeStr}`;
  }

  /**
   * Computes the end datetime given start and duration.
   * @returns {string} End datetime string
   */
  function computeEnd() {
    const start = formatDatetime();
    if (!start) return "";
    const [h, m] = start.slice(11, 16).split(":").map(Number);
    const startDt = new Date(start.slice(0, 10));
    startDt.setHours(h, m, 0, 0);
    const endDt = new Date(startDt.getTime() + duration * 60000);
    const endDate = endDt.toISOString().slice(0, 10);
    const endTime = `${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}`;
    return `${endDate} ${endTime}`;
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

    if (!title) {
      setError("Veuillez entrer un titre.");
      return;
    }

    if (duration < 5) {
      setError("La durée minimum est de 5 minutes.");
      return;
    }

    const start = formatDatetime();
    const end = computeEnd();

    if (!start || !end || end <= start) {
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
        reserved_by: "",
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
    if (e.key === "Enter" && title) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Box onKeyDown={handleKeyDown}>
      <Flex direction="column" gap={4}>
        {/* Title — auto-focused, invites entry */}
        <Box>
          <Input
            size="lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la réunion"
            bg="bg.primary"
            border="none"
            borderBottom="2px solid"
            borderColor="border.default"
            color="text.primary"
            fontSize="xl"
            fontWeight="semibold"
            px={0}
            borderRadius={0}
            _focus={{ borderColor: "accent.default", outline: "none" }}
            _placeholder={{ color: "text.muted" }}
            autoFocus
          />
        </Box>

        {/* Date picker + sliders side by side */}
        <Flex gap={6} align="flex-start" wrap="wrap">
          {/* Inline date picker calendar */}
          <Box bg="gray.300" borderRadius="lg" p={3} borderWidth="1px" borderColor="border.default">
            <DatePicker.Root
              inline
              selectionMode="single"
              value={dateValue}
              onValueChange={(details) => setDateValue(details.value)}
              startOfWeek={1}
            >
              <DatePicker.View view="day">
                <DatePicker.Header />
                <DatePicker.DayTable />
              </DatePicker.View>
              <DatePicker.View view="month">
                <DatePicker.Header />
                <DatePicker.MonthTable />
              </DatePicker.View>
              <DatePicker.View view="year">
                <DatePicker.Header />
                <DatePicker.YearTable />
              </DatePicker.View>
            </DatePicker.Root>
          </Box>

          {/* Hour & Minute sliders */}
          <Flex direction="column" gap={5} minW="160px" flex={1} bg="white" borderRadius="lg" p={4} borderWidth="1px" borderColor="border.default">
            <Box>
              <Text fontSize="sm" color="text.secondary" mb={2}>Heure</Text>
              <SliderRoot
                min={dayStart}
                max={dayEnd - 1}
                step={1}
                value={[hour]}
                onValueChange={(e) => setHour(e.value[0])}
              >
                <SliderTrack bg="bg.secondary">
                  <SliderRange bg="accent.default" />
                </SliderTrack>
                <SliderThumb bg="accent.default" _hover={{ bg: "accent.hover" }}>
                  <SliderValueText color="white" fontSize="xs" />
                </SliderThumb>
              </SliderRoot>
              <Text fontSize="sm" color="text.primary" mt={1} textAlign="center" fontWeight="medium">
                {String(hour).padStart(2, "0")}h
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="text.secondary" mb={2}>Minutes</Text>
              <SliderRoot
                min={0}
                max={55}
                step={5}
                value={[minute]}
                onValueChange={(e) => setMinute(e.value[0])}
              >
                <SliderTrack bg="bg.secondary">
                  <SliderRange bg="accent.default" />
                </SliderTrack>
                <SliderThumb bg="accent.default" _hover={{ bg: "accent.hover" }}>
                  <SliderValueText color="white" fontSize="xs" />
                </SliderThumb>
              </SliderRoot>
              <Text fontSize="sm" color="text.primary" mt={1} textAlign="center" fontWeight="medium">
                {String(minute).padStart(2, "0")}
              </Text>
            </Box>
          </Flex>
        </Flex>

        {/* Duration */}
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="text.secondary" whiteSpace="nowrap">Durée</Text>
          <Input
            type="number"
            size="sm"
            w="80px"
            value={duration}
            onChange={(e) => setDuration(Math.max(5, parseInt(e.target.value, 10) || 5))}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            min={5}
            step={5}
          />
          <Text fontSize="sm" color="text.muted">min</Text>
        </Flex>

        {/* Error */}
        {error && (
          <Text fontSize="sm" color="#f87171">
            {error}
          </Text>
        )}

        {/* Actions */}
        <Flex gap={2} justify="flex-end">
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
