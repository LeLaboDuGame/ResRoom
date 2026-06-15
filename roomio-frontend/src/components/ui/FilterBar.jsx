import { useState } from "react";
import { Input, Checkbox, Text, Flex } from "@chakra-ui/react";

/**
 * Filter bar with capacity slider and equipment checkboxes.
 * @param {Function} [onChange] Callback with current filter state
 * @returns {JSX.Element} The filter bar component
 */
export function FilterBar({ onChange }) {
  const [filters, setFilters] = useState({
    capacity: 0,
    tv: false,
    whiteboard: false,
    computer: false,
  });

  const update = (partial) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    onChange?.(next);
  };

  return (
    <Flex
      wrap="wrap"
      align="center"
      gap={4}
      px={4}
      py={3}
      bg="bg.elevated"
      borderRadius="lg"
    >
      <Flex align="center" gap={2}>
        <Text fontSize="sm" color="text.secondary" whiteSpace="nowrap">
          Capacité min.
        </Text>
        <Input
          type="number"
          min={0}
          value={filters.capacity}
          onChange={(e) => update({ capacity: Number(e.target.value) })}
          w="80px"
          size="sm"
          bg="bg.primary"
          borderColor="border.default"
          color="text.primary"
        />
      </Flex>

      <Checkbox.Root
        size="sm"
        checked={filters.tv}
        onCheckedChange={(e) => update({ tv: e.checked })}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control borderColor="border.default" />
        <Checkbox.Label fontSize="sm" color="text.secondary">
          TV
        </Checkbox.Label>
      </Checkbox.Root>

      <Checkbox.Root
        size="sm"
        checked={filters.whiteboard}
        onCheckedChange={(e) => update({ whiteboard: e.checked })}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control borderColor="border.default" />
        <Checkbox.Label fontSize="sm" color="text.secondary">
          Tableau
        </Checkbox.Label>
      </Checkbox.Root>

      <Checkbox.Root
        size="sm"
        checked={filters.computer}
        onCheckedChange={(e) => update({ computer: e.checked })}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control borderColor="border.default" />
        <Checkbox.Label fontSize="sm" color="text.secondary">
          PC
        </Checkbox.Label>
      </Checkbox.Root>
    </Flex>
  );
}
