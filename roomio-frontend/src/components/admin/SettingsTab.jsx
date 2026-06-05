import { useState, useEffect } from "react";
import { Box, Flex, Input, Button, Text } from "@chakra-ui/react";
import * as api from "../../api/rooms";

/**
 * Settings editor for dayStart, dayEnd, startingSoonBefore, finishingSoonBefore.
 * @return {JSX.Element} SettingsTab component
 */
export function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.fetchSettings();
        setSettings(data.settings);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  function update(field, value) {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  if (loading || !settings) {
    return <Text color="text.muted" py={8} textAlign="center">Chargement…</Text>;
  }

  return (
    <Box maxW="400px">
      <Flex direction="column" gap={4}>
        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Début de journée (heure)</Text>
          <Input
            size="sm"
            type="number"
            value={settings.dayStart}
            onChange={(e) => update("dayStart", parseInt(e.target.value, 10) || 0)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            min={0}
            max={23}
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Fin de journée (heure)</Text>
          <Input
            size="sm"
            type="number"
            value={settings.dayEnd}
            onChange={(e) => update("dayEnd", parseInt(e.target.value, 10) || 0)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            min={0}
            max={23}
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Début imminent (minutes avant)</Text>
          <Input
            size="sm"
            type="number"
            value={settings.startingSoonBefore}
            onChange={(e) => update("startingSoonBefore", parseInt(e.target.value, 10) || 0)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            min={0}
          />
        </Box>

        <Box>
          <Text fontSize="xs" color="text.muted" mb={1}>Fin imminente (minutes avant)</Text>
          <Input
            size="sm"
            type="number"
            value={settings.finishingSoonBefore}
            onChange={(e) => update("finishingSoonBefore", parseInt(e.target.value, 10) || 0)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            min={0}
          />
        </Box>

        <Flex align="center" gap={3}>
          <Button
            size="sm"
            bg="accent.default"
            color="white"
            _hover={{ bg: "accent.hover" }}
            isLoading={saving}
            onClick={handleSave}
          >
            Enregistrer
          </Button>
          {success && (
            <Text fontSize="sm" color="#4ade80">✓ Enregistré</Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
