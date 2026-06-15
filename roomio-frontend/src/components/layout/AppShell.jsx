import { Box } from "@chakra-ui/react";
import { Header } from "./Header";

/**
 * Root layout shell wrapping all page content.
 * @param {React.ReactNode} children Page content to render
 * @returns {JSX.Element} The app shell layout
 */
export function AppShell({ children }) {
  return (
    <Box h="100vh" w="100vw" overflow="hidden" bg="bg.primary" position="relative">
      <Header />
      <Box h="calc(100vh - 56px)" position="relative">
        {children}
      </Box>
    </Box>
  );
}
