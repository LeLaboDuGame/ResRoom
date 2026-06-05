import { Text } from "@chakra-ui/react";
import { useClock } from "../../hooks/useClock";

/**
 * Real-time clock displaying HH:MM:SS.
 * Uses useClock hook updating every second.
 * @return {JSX.Element} Clock text element
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
