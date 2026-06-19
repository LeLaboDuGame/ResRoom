import { useState } from "react";
import { Checkbox, Text, Flex } from "@chakra-ui/react";

/**
 * Filter bar with capacity slider and equipment checkboxes.
 * @param {Function} [onChange] Callback with current filter state
 * @returns {JSX.Element} The filter bar component
 */
export function FilterBar({ onChange }) {
  const [filters, setFilters] = useState({
    capacity: "",
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
          Capacité
        </Text>
        <select
          value={filters.capacity}
          onChange={(e) => update({ capacity: e.target.value })}
          style={{
            background: "var(--chakra-colors-bg-primary)",
            color: "var(--chakra-colors-text-primary)",
            border: "1px solid var(--chakra-colors-border-default)",
            borderRadius: "var(--chakra-radii-md)",
            padding: "2px 8px",
            fontSize: "var(--chakra-font-sizes-sm)",
            width: "120px",
          }}
        >
          <option value="">Toutes</option>
          <option value="petite">Petite (≤ 3)</option>
          <option value="moyenne">Moyenne (4–6)</option>
          <option value="grande">Grande (&gt; 6)</option>
        </select>
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
