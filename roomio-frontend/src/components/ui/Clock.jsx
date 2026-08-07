import { Text } from "@chakra-ui/react";
import { useClock } from "../../hooks/useClock";

/**
 * Real-time digital clock displaying HH:MM:SS.
 * Uses the useClock hook which updates every second.
 * @returns {JSX.Element} The rendered clock text
 */
export function Clock() {
  const time = useClock();
  return (
    <Text
      color="text.secondary"
      fontSize="xl"
      css={{
        fontVariantNumeric: "tabular-nums",
        userSelect: "none",
      }}
    >
      {time}
    </Text>
  );
}
