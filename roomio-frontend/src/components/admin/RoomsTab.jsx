import { useState, useEffect, useCallback } from "react";
import { Box, Flex, Input, Button, Text, Switch, IconButton } from "@chakra-ui/react";
import { Upload, Plus, Trash2 } from "lucide-react";
import * as api from "../../api/apiCall.js";

/**
 * Checks whether a room's fields have been modified from their original values.
 * @param {Object} room Room object with `_orig` snapshot
 * @returns {boolean} True if any field differs from the original
 */
function isDirty(room) {
  const o = room._orig;
  if (!o) return false;
  return (
    room.name !== o.name ||
    room.elements.capacity !== o.capacity ||
    room.elements.tv !== o.tv ||
    room.elements.whiteboard !== o.whiteboard ||
    room.elements.computer !== o.computer
  );
}

let _nextRoomUid = 0;

/**
 * Admin tab for managing rooms: create, edit fields, upload photos, and delete.
 * @returns {JSX.Element} RoomsTab component
 */
export function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [uploading, setUploading] = useState({});
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  /**
   * Fetches all rooms from the API and stores them with original snapshots.
   * @returns {Promise<void>}
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchRooms();
      setRooms((data.rooms || []).map((r) => ({
        ...r,
        _uid: ++_nextRoomUid,
        _orig: {
          name: r.name,
          capacity: r.elements.capacity,
          tv: r.elements.tv,
          whiteboard: r.elements.whiteboard,
          computer: r.elements.computer,
        },
      })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * Updates a single field of a room at the given index.
   * @param {number} index Room index in the rooms array
   * @param {string} field Field name (name, capacity, tv, whiteboard, computer)
   * @param {*} value New value for the field
   */
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

  /**
   * Saves room changes to the API and updates the original snapshot.
   * @param {Object} room Room object to save
   * @returns {Promise<void>}
   */
  async function handleSave(room) {
    const dup = rooms.find((r) => r._orig.name !== room._orig.name && r.name === room.name);
    if (dup) {
      alert(`Une salle nommée "${room.name}" existe déjà.`);
      return;
    }
    const isNewName = room.name !== room._orig.name;
    const origName = isNewName ? room._orig.name : room.name;
    setSaving((prev) => ({ ...prev, [room._orig.name]: true }));
    try {
      await api.updateRoom(origName, {
        name: room.name,
        capacity: room.elements.capacity,
        tv: room.elements.tv,
        whiteboard: room.elements.whiteboard,
        computer: room.elements.computer,
      });
      setRooms((prev) =>
        prev.map((r) =>
          r._orig.name === room._orig.name
            ? { ...r, _orig: { name: room.name, capacity: room.elements.capacity, tv: room.elements.tv, whiteboard: room.elements.whiteboard, computer: room.elements.computer } }
            : r,
        ),
      );
    } catch (e) {
      console.error(e);
    }
    setSaving((prev) => ({ ...prev, [room._orig.name]: false }));
  }

  /**
   * Uploads a photo for the given room.
   * @param {string} roomName Room name
   * @param {File} file Image file to upload
   * @returns {Promise<void>}
   */
  async function handlePhoto(roomName, file) {
    setUploading((prev) => ({ ...prev, [roomName]: true }));
    try {
      await api.uploadPhoto(roomName, file);
    } catch (e) {
      console.error(e);
    }
    setUploading((prev) => ({ ...prev, [roomName]: false }));
  }

  /**
   * Deletes a room after confirmation.
   * @param {Object} room Room object to delete
   * @returns {Promise<void>}
   */
  async function handleDelete(room) {
    try {
      await api.deleteRoom(room._orig.name);
      setRooms((prev) => prev.filter((r) => r._orig.name !== room._orig.name));
    } catch (e) {
      console.error(e);
    }
    setConfirmDelete(null);
  }

  /**
   * Creates a new room with the entered name, then reloads the list.
   * @returns {Promise<void>}
   */
  async function handleCreate() {
    const name = newRoomName.trim();
    if (!name) return;
    if (rooms.some((r) => r.name === name)) {
      alert(`Une salle nommée "${name}" existe déjà.`);
      return;
    }
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

      {/* Cards */}
      <Box display="flex" flexDirection="column" gap={2}>
        {rooms.map((room, i) => {
          const dirty = isDirty(room);
          return (
            <Flex
              key={room._uid}
              align="center"
              gap={3}
              px={4}
              py={3}
              borderRadius="lg"
              bg="bg.secondary"
            >
              {/* Name */}
              <Box flex={1.5} minW={0}>
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

              {/* Capacity */}
              <Box w="80px">
                <Input
                  size="sm"
                  type="number"
                  value={room.elements.capacity}
                  onChange={(e) => updateRoom(i, "capacity", parseInt(e.target.value, 10) || 1)}
                  bg="bg.primary"
                  borderColor="border.default"
                  color="text.primary"
                  _focus={{ borderColor: "accent.default" }}
                  min={1}
                />
              </Box>

              {/* TV */}
              <Flex w="60px" justify="center">
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={room.elements.tv}
                  onCheckedChange={(e) => updateRoom(i, "tv", e.checked)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Flex>

              {/* Whiteboard */}
              <Flex w="60px" justify="center">
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={room.elements.whiteboard}
                  onCheckedChange={(e) => updateRoom(i, "whiteboard", e.checked)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Flex>

              {/* Computer */}
              <Flex w="60px" justify="center">
                <Switch.Root
                  size="sm"
                  colorPalette="blue"
                  checked={room.elements.computer}
                  onCheckedChange={(e) => updateRoom(i, "computer", e.checked)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Flex>

              {/* Photo upload */}
              <Flex w="50px" justify="center">
                <Box
                  as="label"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="text.muted"
                    _hover={{ color: "accent.default" }}
                    isLoading={uploading[room.name]}
                    aria-label="Upload photo"
                    as="span"
                  >
                    <Upload size={14} />
                  </IconButton>
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
              </Flex>

              {/* Actions */}
              <Flex gap={1} align="center" minW="120px" justify="flex-end">
                <Button
                  size="xs"
                  bg={dirty ? "accent.default" : "bg.elevated"}
                  color={dirty ? "white" : "text.muted"}
                  _hover={dirty ? { bg: "accent.hover" } : {}}
                  isLoading={saving[room._orig.name]}
                  onClick={() => handleSave(room)}
                >
                  Sauver
                </Button>
                <IconButton
                  size="xs"
                  variant="ghost"
                  color="text.muted"
                  _hover={{ color: "#f87171" }}
                  onClick={() => setConfirmDelete(room)}
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </IconButton>
              </Flex>
            </Flex>
          );
        })}
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
              Êtes-vous sûr de vouloir supprimer <strong>{confirmDelete._orig.name}</strong> ?
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
