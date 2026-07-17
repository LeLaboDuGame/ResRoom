import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Box, Flex, Input, Button, Text,
  DatePicker,
} from "@chakra-ui/react";
import { parseDate } from "@ark-ui/react/date-picker";
import { createReservation, fetchEmails } from "../../api/apiCall.js";
import { useSettings } from "../../hooks/useSettings";
import { ScrollDownSlider } from "../ui/ScrollDownSlider";

/**
 * Booking form with inline date picker calendar, hour/minute sliders,
 * title and duration fields. Calls createReservation API on submit
 * with overlap and past-date validation.
 * @param {Object} props
 * @param {string} roomName Target room name
 * @param {Array} existingReservations Existing reservations for overlap check
 * @param {Function} onSuccess Called with new reservation on success
 * @param {Function} onCancel Called when user cancels
 * @param {Date} [defaultDate] Pre-filled date (defaults to today)
 * @param {number} [defaultHour] Pre-filled hour (defaults to current rounded hour)
 * @param {number} [defaultMinute] Pre-filled minute (defaults to current rounded minute)
 * @param {Function} [onTimeChange] Called with (hour, minute, endHour, endMinute) when time wheels change
 * @return {JSX.Element} BookingForm component
 */
export function BookingForm({ roomName, existingReservations = [], onSuccess, onCancel, defaultDate: defaultDateProp, defaultHour: defaultHourProp, defaultMinute: defaultMinuteProp, onTimeChange }) {
  const { dayStart, dayEnd } = useSettings();

  const now = new Date();
  const roundedMin = Math.ceil(now.getMinutes() / 5) * 5;
  now.setMinutes(roundedMin, 0, 0);

  const fallbackHour = Math.max(dayStart, Math.min(dayEnd - 1, now.getHours()));
  const fallbackMin = now.getMinutes();

  const hourItems = useMemo(() =>
    Array.from({length: dayEnd - dayStart}, (_, i) => String(i + dayStart).padStart(2, "0")),
    [dayStart, dayEnd]
  );
  const minItems = useMemo(() =>
    Array.from({length: 12}, (_, i) => String(i * 5).padStart(2, "0")),
    []
  );

  const fallbackEndHour = Math.min(dayEnd - 1, fallbackHour + 1);

  const defaultParsed = defaultDateProp ? parseDate(defaultDateProp) : parseDate(new Date());
  const [dateValue, setDateValue] = useState([defaultParsed, defaultParsed]);
  const [hour, setHour] = useState(defaultHourProp ?? fallbackHour);
  const [minute, setMinute] = useState(defaultMinuteProp ?? fallbackMin);
  const initialEndHour = defaultHourProp !== undefined ? Math.min(dayEnd - 1, defaultHourProp + 1) : fallbackEndHour;
  const [endHour, setEndHour] = useState(initialEndHour);
  const [endMinute, setEndMinute] = useState(defaultMinuteProp ?? fallbackMin);

  const durationRef = useRef((initialEndHour * 60 + (defaultMinuteProp ?? fallbackMin)) - ((defaultHourProp ?? fallbackHour) * 60 + (defaultMinuteProp ?? fallbackMin)));

  function updateEndFromDuration() {
    const startMin = hour * 60 + minute;
    const endMin = Math.min(startMin + durationRef.current, dayEnd * 60 - 5);
    const newEndHour = Math.floor(endMin / 60);
    const newEndMin = endMin % 60;
    if (newEndHour !== endHour || newEndMin !== endMinute) {
      setEndHour(newEndHour);
      setEndMinute(newEndMin);
    }
  }

  useEffect(() => {
    updateEndFromDuration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute]);

  const prevTime = useRef({hour, minute, endHour, endMinute});
  useEffect(() => {
    const {hour: pH, minute: pM, endHour: pEH, endMinute: pEM} = prevTime.current;
    if (hour !== pH || minute !== pM || endHour !== pEH || endMinute !== pEM) {
      onTimeChange?.(hour, minute, endHour, endMinute);
      prevTime.current = {hour, minute, endHour, endMinute};
    }
  }, [hour, minute, endHour, endMinute, onTimeChange]);
  const [title, setTitle] = useState("");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [emailDirectory, setEmailDirectory] = useState([]);
  const [emailDropdownOpen, setEmailDropdownOpen] = useState(false);
  const [emailHighlightIndex, setEmailHighlightIndex] = useState(-1);
  const emailDropdownRef = useRef(null);
  const emailInputRef = useRef(null);
  const [debutOpen, setDebutOpen] = useState(false);
  const [finOpen, setFinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEmails()
      .then((data) => setEmailDirectory(data.emails || []))
      .catch(() => {});
  }, []);

  const emailSuggestions = useMemo(() => {
    const q = emailInput.trim().toLowerCase();
    if (!q) return emailDirectory.filter((e) => !selectedEmails.includes(e));
    return emailDirectory.filter(
      (e) => e.toLowerCase().includes(q) && !selectedEmails.includes(e),
    );
  }, [emailInput, emailDirectory, selectedEmails]);

  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const addEmail = useCallback((email) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) {
      setError("Adresse email invalide.");
      return;
    }
    if (!selectedEmails.includes(trimmed)) {
      setSelectedEmails((prev) => [...prev, trimmed]);
    }
    setEmailInput("");
    setEmailDropdownOpen(false);
    setEmailHighlightIndex(-1);
    setError("");
  }, [selectedEmails, isValidEmail]);

  const removeEmail = useCallback((email) => {
    setSelectedEmails((prev) => prev.filter((e) => e !== email));
  }, []);

  function handleEmailKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setEmailHighlightIndex((prev) => Math.min(prev + 1, emailSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setEmailHighlightIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (emailHighlightIndex >= 0 && emailHighlightIndex < emailSuggestions.length) {
        addEmail(emailSuggestions[emailHighlightIndex]);
      } else if (emailInput.trim()) {
        addEmail(emailInput);
      }
    } else if (e.key === "Escape") {
      setEmailDropdownOpen(false);
      setEmailHighlightIndex(-1);
    } else if (e.key === "Backspace" && !emailInput && selectedEmails.length > 0) {
      setSelectedEmails((prev) => prev.slice(0, -1));
    }
  }

  function fmtDate(d) {
    return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
  }

  /** Formats start datetime from dateValue[0] + hour/minute into "YYYY-MM-DD HH:mm" */
  function formatDatetime() {
    const d = dateValue[0];
    if (!d) return "";
    return `${fmtDate(d)} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  /**
   * Computes the end datetime from dateValue[1] (or dateValue[0] if missing) and endHour/endMinute.
   * @returns {string} End datetime string
   */
  function computeEnd() {
    const d = dateValue[1] || dateValue[0];
    if (!d) return "";
    return `${fmtDate(d)} ${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
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
        reserved_by: selectedEmails.join(", "),
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

        {/* Réservé par — multi-email combobox */}
        <Box position="relative" ref={emailDropdownRef}>
          <Flex
            gap={1}
            flexWrap="wrap"
            align="center"
            bg="bg.primary"
            borderBottom="2px solid"
            borderColor="border.default"
            px={0}
            py={1}
            minH="40px"
            cursor="text"
            onClick={() => emailInputRef.current?.focus()}
            _focusWithin={{ borderColor: "accent.default" }}
          >
            {selectedEmails.map((email) => (
              <Flex
                key={email}
                align="center"
                gap={1}
                bg="accent.default"
                color="white"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
                fontWeight="medium"
                maxW="200px"
                minW={0}
              >
                <Text as="span" noOfLines={1} truncate>{email}</Text>
                <Box
                  as="button"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeEmail(email); }}
                  cursor="pointer"
                  lineHeight={1}
                  flexShrink={0}
                  _hover={{ opacity: 0.7 }}
                >
                  ✕
                </Box>
              </Flex>
            ))}
            <Input
              ref={emailInputRef}
              size="sm"
              flex={1}
              minW="120px"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setEmailDropdownOpen(true);
                setEmailHighlightIndex(-1);
                setError("");
              }}
              onFocus={() => setEmailDropdownOpen(true)}
              onBlur={() => setTimeout(() => setEmailDropdownOpen(false), 150)}
              onKeyDown={handleEmailKeyDown}
              placeholder={selectedEmails.length === 0 ? "Réservé par" : "Ajouter..."}
              bg="transparent"
              border="none"
              color="text.primary"
              fontSize="md"
              px={0}
              _focus={{ outline: "none" }}
              _placeholder={{ color: "text.muted" }}
            />
          </Flex>

          {/* Suggestions dropdown */}
          {emailDropdownOpen && emailSuggestions.length > 0 && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={1}
              bg="bg.primary"
              border="1px solid"
              borderColor="border.default"
              borderRadius="md"
              maxH="180px"
              overflowY="auto"
              zIndex={100}
              boxShadow="lg"
            >
              {emailSuggestions.map((email, i) => (
                <Box
                  key={email}
                  px={3}
                  py={2}
                  fontSize="sm"
                  cursor="pointer"
                  bg={i === emailHighlightIndex ? "accent.default" : "transparent"}
                  color={i === emailHighlightIndex ? "white" : "text.primary"}
                  _hover={{ bg: i === emailHighlightIndex ? "accent.default" : "bg.secondary" }}
                  onMouseDown={(e) => { e.preventDefault(); addEmail(email); }}
                  onMouseEnter={() => setEmailHighlightIndex(i)}
                >
                  {email}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Date picker + time wheels */}
        <Flex gap={6} align="center" wrap="wrap" justify="center">
          {/* Inline date picker calendar */}
          <Box bg="gray.300" borderRadius="lg" p={3} borderWidth="1px" borderColor="border.default">
            <DatePicker.Root
              inline
              selectionMode="range"
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

          {/* Time columns */}
          <Flex gap={8} align="flex-start">
            {/* Heure de début */}
            <Box textAlign="center">
              <Text fontSize="sm" color="text.secondary" mb={2} fontWeight="medium">Début</Text>
              <Flex gap={2}>
                <ScrollDownSlider
                  items={hourItems}
                  value={String(hour).padStart(2, "0")}
                  onChange={(v) => setHour(parseInt(v, 10))}
                  w={{ base: "60px", md: "80px" }}
                  open={debutOpen}
                  onOpenChange={setDebutOpen}
                />
                <ScrollDownSlider
                  items={minItems}
                  value={String(minute).padStart(2, "0")}
                  onChange={(v) => setMinute(parseInt(v, 10))}
                  w={{ base: "60px", md: "80px" }}
                  open={debutOpen}
                  onOpenChange={setDebutOpen}
                />
              </Flex>
            </Box>

            {/* Heure de fin */}
            <Box textAlign="center">
              <Text fontSize="sm" color="text.secondary" mb={2} fontWeight="medium">Fin</Text>
              <Flex gap={2}>
                <ScrollDownSlider
                  items={hourItems}
                  value={String(endHour).padStart(2, "0")}
                  onChange={(v) => {
                    const eh = parseInt(v, 10);
                    setEndHour(eh);
                    durationRef.current = (eh * 60 + endMinute) - (hour * 60 + minute);
                  }}
                  w={{ base: "60px", md: "80px" }}
                  open={finOpen}
                  onOpenChange={setFinOpen}
                />
                <ScrollDownSlider
                  items={minItems}
                  value={String(endMinute).padStart(2, "0")}
                  onChange={(v) => {
                    const em = parseInt(v, 10);
                    setEndMinute(em);
                    durationRef.current = (endHour * 60 + em) - (hour * 60 + minute);
                  }}
                  w={{ base: "60px", md: "80px" }}
                  open={finOpen}
                  onOpenChange={setFinOpen}
                />
              </Flex>
            </Box>
          </Flex>
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
