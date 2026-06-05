import { Flex, Box, Text } from "@chakra-ui/react";

const labels = {
  free: "Libre",
  startingSoon: "Bientôt",
  meeting: "Occupée",
  finishingSoon: "Bientôt libre",
};

const dotColors = {
  free: "status.free",
  startingSoon: "status.startingSoon",
  meeting: "status.meeting",
  finishingSoon: "status.finishingSoon",
};

const bgColors = {
  free: "rgba(52,211,153,0.12)",
  startingSoon: "rgba(251,191,36,0.12)",
  meeting: "rgba(248,113,113,0.12)",
  finishingSoon: "rgba(251,146,60,0.12)",
};

/**
 * Compact pill badge showing room status.
 * @param {string} [status="free"] Room status key
 * @return {JSX.Element} Status badge
 */
export function StatusBadge({ status = "free" }) {
  return (
    <Flex
      align="center"
      gap={1.5}
      px={2.5}
      py={0.5}
      borderRadius="full"
      bg={bgColors[status]}
    >
      <Box w={2} h={2} borderRadius="full" bg={dotColors[status]} />
      <Text fontSize="sm" fontWeight="medium" color={dotColors[status]}>
        {labels[status]}
      </Text>
    </Flex>
  );
}
