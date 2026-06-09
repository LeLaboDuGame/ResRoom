import { Box, Text, Flex } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { AdminTabs } from "../components/admin/AdminTabs";

export default function Admin() {
  return (
    <Box minH="100vh" bg="#0a0a0b" color="text.primary" p={6}>
      <Flex align="center" gap={4} mb={6}>
        <Text fontSize="2xl" fontWeight="bold">Administration</Text>
        <Text as={Link} to="/debug" fontSize="sm" color="text.muted" _hover={{ color: "accent.default" }}>
          Debug
        </Text>
        <Text as={Link} to="/" fontSize="sm" color="text.muted" _hover={{ color: "accent.default" }}>
          Dashboard
        </Text>
      </Flex>
      <AdminTabs />
    </Box>
  );
}
