import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Input, Button, Text, Switch } from "@chakra-ui/react";
import { Upload } from "lucide-react";
import * as api from "../../api/rooms";

/**
 * Editable rooms table: name, capacity, equipment toggles, photo upload.
 * @return {JSX.Element} RoomsTab component
 */
export function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [uploading, setUploading] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchRooms();
      setRooms(data.rooms || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateRoom(index, field, value) {
    setRooms((prev) => {
      const next = [...prev];
      if (field === "capacity") {
        next[index] = { ...next[index], elements: { ...next[index].elements, capacity: value } };
      } else if (field === "name") {
        next[index] = { ...next[index], name: value };
      } else {
        next[index] = { ...next[index], elements: { ...next[index].elements, [field]: value } };
      }
      return next;
    });
  }

  async function handleSave(room) {
    setSaving((prev) => ({ ...prev, [room.name]: true }));
    try {
      await api.updateRoom(room.name, {
        name: room.name,
        capacity: room.elements.capacity,
        tv: room.elements.tv,
        whiteboard: room.elements.whiteboard,
        computer: room.elements.computer,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving((prev) => ({ ...prev, [room.name]: false }));
  }

  async function handlePhoto(roomName, file) {
    setUploading((prev) => ({ ...prev, [roomName]: true }));
    try {
      await api.uploadPhoto(roomName, file);
    } catch (e) {
      console.error(e);
    }
    setUploading((prev) => ({ ...prev, [roomName]: false }));
  }

  if (loading) {
    return <Text color="text.muted" py={8} textAlign="center">Chargement…</Text>;
  }

  return (
    <Box overflowX="auto">
      <Box
        as="table"
        w="100%"
        fontSize="sm"
        borderCollapse="collapse"
      >
        <Box as="thead">
          <Box as="tr" color="text.muted" borderBottom="1px solid" borderColor="border.default">
            <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Nom</Box>
            <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Capacité</Box>
            <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium">TV</Box>
            <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium">Tableau</Box>
            <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium">PC</Box>
            <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Photo</Box>
            <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium" w="80px"></Box>
          </Box>
        </Box>
        <Box as="tbody">
          {rooms.map((room, i) => (
            <Box
              as="tr"
              key={i}
              borderBottom="1px solid"
              borderColor="border.default"
              _hover={{ bg: "bg.elevated" }}
            >
              <Box as="td" px={3} py={2}>
                <Input
                  size="sm"
                  value={room.name}
                  onChange={(e) => updateRoom(i, "name", e.target.value)}
                  bg="bg.primary"
                  borderColor="border.default"
                  color="text.primary"
                  _focus={{ borderColor: "accent.default" }}
                />
              </Box>
              <Box as="td" px={3} py={2}>
                <Input
                  size="sm"
                  type="number"
                  value={room.elements.capacity}
                  onChange={(e) => updateRoom(i, "capacity", parseInt(e.target.value, 10) || 1)}
                  bg="bg.primary"
                  borderColor="border.default"
                  color="text.primary"
                  _focus={{ borderColor: "accent.default" }}
                  w="80px"
                  min={1}
                />
              </Box>
              <Box as="td" px={3} py={2} textAlign="center">
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={room.elements.tv}
                  onCheckedChange={(e) => updateRoom(i, "tv", e.checked)}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Box>
              <Box as="td" px={3} py={2} textAlign="center">
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={room.elements.whiteboard}
                  onCheckedChange={(e) => updateRoom(i, "whiteboard", e.checked)}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Box>
              <Box as="td" px={3} py={2} textAlign="center">
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={room.elements.computer}
                  onCheckedChange={(e) => updateRoom(i, "computer", e.checked)}
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Box>
              <Box as="td" px={3} py={2}>
                <Box as="label" cursor="pointer">
                  <Button
                    size="xs"
                    variant="ghost"
                    color="text.muted"
                    _hover={{ color: "accent.default" }}
                    isLoading={uploading[room.name]}
                    as="span"
                  >
                    <Upload size={14} />
                  </Button>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhoto(room.name, file);
                      e.target.value = "";
                    }}
                  />
                </Box>
              </Box>
              <Box as="td" px={3} py={2}>
                <Button
                  size="xs"
                  bg="accent.default"
                  color="white"
                  _hover={{ bg: "accent.hover" }}
                  isLoading={saving[room.name]}
                  onClick={() => handleSave(room)}
                >
                  Sauver
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
