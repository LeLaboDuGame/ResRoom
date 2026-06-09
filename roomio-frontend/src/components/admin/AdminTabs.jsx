import { useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { RoomsTab } from "./RoomsTab";
import { SettingsTab } from "./SettingsTab";
import { HistoryTab } from "./HistoryTab";

/**
 * Admin panel with tab navigation for rooms, settings, and history.
 * @return {JSX.Element} AdminTabs component
 */
export function AdminTabs() {
  const [activeTab, setActiveTab] = useState("rooms");

  const tabs = [
    { id: "rooms", label: "Salles" },
    { id: "settings", label: "Paramètres" },
    { id: "history", label: "Historique" },
  ];

  return (
    <Box>
      <Flex
        role="tablist"
        gap={1}
        mb={6}
        borderBottom="1px solid"
        borderColor="border.default"
        pb={0}
      >
        {tabs.map((tab) => (
          <Box
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            as="button"
            px={4}
            py={2.5}
            fontSize="sm"
            fontWeight="medium"
            color={activeTab === tab.id ? "accent.default" : "text.muted"}
            borderBottom="2px solid"
            borderColor={activeTab === tab.id ? "accent.default" : "transparent"}
            _hover={{ color: "text.primary" }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Box>
        ))}
      </Flex>

      {activeTab === "rooms" && <RoomsTab />}
      {activeTab === "settings" && <SettingsTab />}
      {activeTab === "history" && <HistoryTab />}
    </Box>
  );
}
