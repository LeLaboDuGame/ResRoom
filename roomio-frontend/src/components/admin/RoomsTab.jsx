import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Input, Button, Text, Switch } from "@chakra-ui/react";
import { Upload, Plus, Trash2 } from "lucide-react";
import * as api from "../../api/rooms";

export function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [uploading, setUploading] = useState({});
  const [savedMsg, setSavedMsg] = useState({});
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchRooms();
      setRooms((data.rooms || []).map((r) => ({ ...r, _origName: r.name })));
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
        next[index] = { ...next[index], name: value, _nameChanged: true };
      } else {
        next[index] = { ...next[index], elements: { ...next[index].elements, [field]: value } };
      }
      return next;
    });
  }

  async function handleSave(room) {
    setSaving((prev) => ({ ...prev, [room.name]: true }));
    try {
      await api.updateRoom(room._origName || room.name, {
        name: room.name,
        capacity: room.elements.capacity,
        tv: room.elements.tv,
        whiteboard: room.elements.whiteboard,
        computer: room.elements.computer,
      });
      setSavedMsg((prev) => ({ ...prev, [room.name]: true }));
      setTimeout(() => setSavedMsg((prev) => ({ ...prev, [room.name]: false })), 2000);
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

  async function handleDelete(room) {
    try {
      await api.deleteRoom(room.name);
      setRooms((prev) => prev.filter((r) => r.name !== room.name));
    } catch (e) {
      console.error(e);
    }
    setConfirmDelete(null);
  }

  async function handleCreate() {
    const name = newRoomName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await api.createRoom(name);
      await load();
      setNewRoomName("");
    } catch (e) {
      console.error(e);
    }
    setCreating(false);
  }

  if (loading) {
    return <Text color="text.muted" py={8} textAlign="center">Chargement…</Text>;
  }

  return (
    <Box>
      {/* Add room */}
      <Flex gap={3} mb={4}>
        <Input
          size="sm"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="Nom de la nouvelle salle"
          bg="bg.primary"
          borderColor="border.default"
          color="text.primary"
          _focus={{ borderColor: "accent.default" }}
          maxW="260px"
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
        />
        <Button
          size="sm"
          bg="accent.default"
          color="white"
          _hover={{ bg: "accent.hover" }}
          isLoading={creating}
          leftIcon={<Plus size={14} />}
          onClick={handleCreate}
        >
          Ajouter
        </Button>
      </Flex>

      {/* Table */}
      <Box overflowX="auto">
        <Box as="table" w="100%" fontSize="sm" borderCollapse="collapse">
          <Box as="thead">
            <Box as="tr" color="text.muted" borderBottom="1px solid" borderColor="border.default">
              <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Nom</Box>
              <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Capacité</Box>
              <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium">TV</Box>
              <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium">Tableau</Box>
              <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium">PC</Box>
              <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Photo</Box>
              <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium" w="120px">Actions</Box>
            </Box>
          </Box>
          <Box as="tbody">
            {rooms.map((room, i) => (
              <Box
                as="tr"
                key={room.name}
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
                  <Flex gap={1} align="center">
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
                    {savedMsg[room.name] && (
                      <Text fontSize="xs" color="#4ade80">✓</Text>
                    )}
                    <Button
                      size="xs"
                      variant="ghost"
                      color="text.muted"
                      _hover={{ color: "#f87171" }}
                      onClick={() => setConfirmDelete(room)}
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Flex>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(0,0,0,0.6)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box bg="#1a1a1d" borderRadius="xl" p={6} maxW="360px" w="90%" boxShadow="0 0 40px rgba(0,0,0,0.5)">
            <Text fontWeight="bold" mb={3}>Supprimer la salle ?</Text>
            <Text fontSize="sm" color="text.secondary" mb={4}>
              Êtes-vous sûr de vouloir supprimer <strong>{confirmDelete.name}</strong> ?
              Toutes ses réservations seront perdues.
            </Text>
            <Flex gap={2} justify="flex-end">
              <Button
                size="sm"
                variant="ghost"
                color="text.muted"
                onClick={() => setConfirmDelete(null)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                bg="#f87171"
                color="white"
                _hover={{ bg: "#ef4444" }}
                onClick={() => handleDelete(confirmDelete)}
              >
                Supprimer
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}
