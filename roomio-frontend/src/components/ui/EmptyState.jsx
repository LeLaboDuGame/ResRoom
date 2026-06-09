import { Flex, Text } from "@chakra-ui/react";

/**
 * Centered empty state with icon, title and description.
 * @param {string} [icon="📭"] Emoji or SVG icon
 * @param {string} [title] Heading text
 * @param {string} [description] Body text
 * @return {JSX.Element} Empty state
 */
export function EmptyState({ icon = "📭", title, description }) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={16}
      px={4}
      textAlign="center"
    >
      <Text fontSize="3xl" mb={2} lineHeight={1}>
        {icon}
      </Text>
      {title && (
        <Text fontSize="lg" fontWeight="semibold" color="text.primary" mb={1}>
          {title}
        </Text>
      )}
      {description && (
        <Text fontSize="sm" color="text.muted" maxW="sm">
          {description}
        </Text>
      )}
    </Flex>
  );
}
