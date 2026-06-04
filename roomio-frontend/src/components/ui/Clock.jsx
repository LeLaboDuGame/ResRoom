import { Text } from "@chakra-ui/react";
import { useClock } from "../../hooks/useClock";

export function Clock() {
  const time = useClock();
  return (
    <Text color="text.secondary" fontSize="xl" css={{ fontVariantNumeric: "tabular-nums", userSelect: "none" }}>
      {time}
    </Text>
  );
}
