import { Flex, Text } from "@chakra-ui/react";

/**
 * Empty state placeholder with icon, title and description.
 * @param {string} [icon] Icon name to display
 * @param {string} [title] Empty state title
 * @param {string} [description] Empty state description
 * @returns {JSX.Element} The empty state component
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
