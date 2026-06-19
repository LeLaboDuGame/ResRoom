import { useState, useRef, useCallback, useEffect } from "react";
import { Box } from "@chakra-ui/react";

const ITEM_H = 40;
const VISIBLE = 5;

/**
 * A vertical scroll wheel picker. Collapsed shows the selected value;
 * expanded shows a scrollable list that snaps to center on the closest item.
 * The arrow ▸ on the right of the centered item shows the snap position.
 * @param {Object} props
 * @param {Array} props.items List of values (strings/numbers)
 * @param {*} [props.value] Currently selected value
 * @param {Function} [props.onChange] Called with the new value on selection
 * @param {number|string} [props.w] Width of the component
 * @param {number} [props.h] Height of the expanded scroll area in pixels
 * @param {string} [props.fontSize] Font size for items and collapsed value ("lg", "md", etc.)
 * @param {boolean} [props.open] Controlled open state
 * @param {Function} [props.onOpenChange] Called with the new open state
 * @returns {JSX.Element} ScrollDownSlider component
 */
export function ScrollDownSlider({ items = [], value, onChange, w, h, fontSize = { base: "sm", md: "lg" }, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  const tickingRef = useRef(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const safeValue = items.includes(value) ? value : items[0];
  const selectedIndex = items.indexOf(safeValue);

  const tryOpen = useCallback(() => {
    if (controlledOpen === undefined) setInternalOpen(true);
    onOpenChange?.(true);
  }, [controlledOpen, onOpenChange]);

  const tryClose = useCallback(() => {
    if (controlledOpen === undefined) setInternalOpen(false);
    onOpenChange?.(false);
  }, [controlledOpen, onOpenChange]);

  useEffect(() => {
    if (open && scrollRef.current && selectedIndex >= 0) {
      scrollRef.current.scrollTop = selectedIndex * ITEM_H;
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        tryClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, tryClose]);

  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;
    requestAnimationFrame(() => {
      if (!scrollRef.current) return;
      const index = Math.round(scrollRef.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      onChange?.(items[clamped]);
      tickingRef.current = false;
    });
  }, [items, onChange]);

  const containerH = h ?? VISIBLE * ITEM_H;
  const padItems = Math.floor(containerH / ITEM_H / 2);

  return (
    <Box ref={containerRef} position="relative" display="inline-block" userSelect="none">
      {!open ? (
        <Box
          as="button"
          onClick={tryOpen}
          cursor="pointer"
          bg="bg.primary"
          borderRadius="md"
          px={{ base: 3, md: 5 }}
          py={2}
          border="1px solid"
          borderColor="border.default"
          color="text.primary"
          fontSize={fontSize}
          fontWeight="medium"
          w={w}
          minW={{ base: "50px", md: "80px" }}
          textAlign="center"
          _hover={{ borderColor: "accent.default" }}
        >
          {String(safeValue)}
        </Box>
      ) : (
        <Box
          position="relative"
          w={w}
          border="1px solid"
          borderColor="accent.default"
          borderRadius="md"
          overflow="hidden"
        >
          <Box
            ref={scrollRef}
            h={`${containerH}px`}
            overflowY="auto"
            bg="bg.primary"
            css={{
              scrollSnapType: "y mandatory",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
            onScroll={handleScroll}
          >
            <Box h={`${padItems * ITEM_H}px`} pointerEvents="none" />

            {items.map((item) => (
              <Box
                key={item}
                h={`${ITEM_H}px`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                css={{ scrollSnapAlign: "center" }}
                bg={item === safeValue ? "accent.default" : "transparent"}
                color={item === safeValue ? "white" : "text.primary"}
                fontSize={fontSize}
                fontWeight="medium"
                cursor="pointer"
                _hover={{ bg: item === safeValue ? "accent.default" : "whiteAlpha.200" }}
                onClick={() => {
                  onChange?.(item);
                  tryClose();
                }}
              >
                {String(item)}
              </Box>
            ))}

            <Box h={`${padItems * ITEM_H}px`} pointerEvents="none" />
          </Box>

          <Box
            position="absolute"
            top="50%"
            right={0}
            transform="translateY(-50%)"
            pointerEvents="none"
            zIndex={5}
            color="gray.400"
            fontSize="md"
            lineHeight={1}
          >
            ◂
          </Box>

          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h={`${padItems * ITEM_H}px`}
            pointerEvents="none"
            css={{ background: "linear-gradient(to bottom, var(--chakra-colors-bg-primary), transparent)" }}
          />
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h={`${padItems * ITEM_H}px`}
            pointerEvents="none"
            css={{ background: "linear-gradient(to top, var(--chakra-colors-bg-primary), transparent)" }}
          />
        </Box>
      )}
    </Box>
  );
}
