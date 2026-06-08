import { Box, Flex, Text, Image } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { Clock } from "../ui/Clock";
import logoSvg from "../../assets/logo/ResRoomLogo.svg";

export function ResRoomLogo() {
  return (
    <Image src={logoSvg} alt="ResRoom" h="32px" w="auto" userSelect="none" draggable={false} />
  );
}

export function Header() {
  return (
    <Box
      as="header"
      h="56px"
      display="flex"
      alignItems="center"
      justify="space-between"
      px={6}
      bg="bg.secondary"
      borderBottom="1px solid"
      borderColor="border.default"
    >
      <Flex align="center" gap={6}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <ResRoomLogo />
        </Link>
        <Flex align="center" gap={4}>
          <Text
            as={Link}
            to="/admin"
            fontSize="sm"
            color="text.muted"
            _hover={{ color: "accent.default" }}
          >
            Admin
          </Text>
          <Text
            as={Link}
            to="/debug"
            fontSize="sm"
            color="text.muted"
            _hover={{ color: "accent.default" }}
          >
            Debug
          </Text>
        </Flex>
      </Flex>
      <Clock />
    </Box>
  );
}
