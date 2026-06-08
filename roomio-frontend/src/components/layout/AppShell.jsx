import { Box } from "@chakra-ui/react";
import { Header } from "./Header";

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
