import { Box, Button } from "@chakra-ui/react";
import { Plus } from "lucide-react";

/**
 * Reusable booking button with two variants.
 * @param {"plus"|"default"} variant Visual style
 * @param {Function} onClick Click handler
 * @param {string} [ariaLabel] Accessibility label
 * @return {JSX.Element} BookingButton component
 */
export function BookingButton({ variant = "default", onClick, ariaLabel }) {
  if (variant === "plus") {
    return (
      <Box
        as="button"
        w={12}
        h={12}
        minW="44px"
        minH="44px"
        borderRadius="full"
        bg="rgba(79,140,255,0.15)"
        color="accent.default"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor="pointer"
        _hover={{ bg: "rgba(79,140,255,0.25)" }}
        onClick={onClick}
        aria-label={ariaLabel || "Réserver"}
      >
        <Plus size={24} />
      </Box>
    );
  }

  return (
    <Button
      size="sm"
      bg="accent.default"
      color="white"
      minH="44px"
      minW="44px"
      _hover={{ bg: "accent.hover" }}
      onClick={onClick}
      aria-label={ariaLabel || "Réserver"}
    >
      Réserver
    </Button>
  );
}
