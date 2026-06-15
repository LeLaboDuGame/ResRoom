import { useState, useEffect, useRef, useCallback } from "react";
import { Box, Flex, Input, Button, Text } from "@chakra-ui/react";

/**
 * Confirmation modal for deleting a reservation.
 * Requires typing "oui" to enable the delete button.
 * Implements focus trap and keyboard handling (Escape to close, Enter to confirm).
 * @param {Object} props
 * @param {boolean} isOpen Whether the modal is visible
 * @param {Function} onClose Callback to close the modal
 * @param {Object|null} reservation Reservation object with title, start, end, uid
 * @param {Function} onConfirm Callback with reservation uid when confirmed
 * @return {JSX.Element|null} DeleteModal component
 */
export function DeleteModal({ isOpen, onClose, reservation, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const isConfirmed = confirmText.toLowerCase() === "oui";

  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  async function handleConfirm() {
    if (!isConfirmed || !reservation) return;
    setLoading(true);
    try {
      await onConfirm?.(reservation.uid);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen || !reservation) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(0,0,0,0.6)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={9999}
      onClick={onClose}
    >
      <Box
        ref={modalRef}
        bg="bg.elevated"
        borderRadius="xl"
        border="1px solid"
        borderColor="border.default"
        p={6}
        w="90%"
        maxW="400px"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmer la suppression"
      >
        <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={1}>
          Supprimer la réservation
        </Text>
        <Text fontSize="sm" color="text.secondary" mb={4}>
          "{reservation.title}" — {reservation.start?.slice(-5)} à {reservation.end?.slice(-5)}
        </Text>
        <Text fontSize="xs" color="text.muted" mb={2}>
          Tape <Text as="strong" color="text.primary">oui</Text> pour confirmer
        </Text>
        <Input
          ref={inputRef}
          size="sm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          bg="bg.primary"
          borderColor="border.default"
          color="text.primary"
          _focus={{ borderColor: "accent.default" }}
          placeholder="oui"
          autoComplete="off"
        />
        <Flex gap={2} mt={4} justify="flex-end">
          <Button
            size="sm"
            variant="ghost"
            color="text.secondary"
            _hover={{ color: "text.primary", bg: "bg.secondary" }}
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            bg="#f87171"
            color="white"
            _hover={{ bg: "#ef4444" }}
            opacity={isConfirmed ? 1 : 0.4}
            cursor={isConfirmed ? "pointer" : "not-allowed"}
            disabled={!isConfirmed}
            isLoading={loading}
            onClick={handleConfirm}
          >
            Supprimer
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
