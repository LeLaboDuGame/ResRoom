import { useState, useEffect, useMemo } from "react";
import { Box, Flex, Input, Button, Text } from "@chakra-ui/react";
import { Trash2 } from "lucide-react";
import * as api from "../../api/rooms";

export function HistoryTab() {
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterText, setFilterText] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [historyData, roomsData] = await Promise.all([
          api.fetchHistory(),
          api.fetchRooms(),
        ]);
        setReservations(historyData.reservations || []);
        setRooms(roomsData.rooms || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (filterRoom && r.room !== filterRoom) return false;
      if (filterDate && !r.start?.startsWith(filterDate)) return false;
      if (filterText) {
        const q = filterText.toLowerCase();
        const match =
          r.title?.toLowerCase().includes(q) ||
          r.reserved_by?.toLowerCase().includes(q) ||
          r.room?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [reservations, filterRoom, filterDate, filterText]);

  async function handleDelete(reservation) {
    if (deleting) return;
    setDeleting(reservation.uid);
    try {
      await api.deleteReservation(reservation.room, reservation.uid);
      setReservations((prev) => prev.filter((r) => r.uid !== reservation.uid));
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
    setConfirmDelete(null);
  }

  if (loading) {
    return <Text color="text.muted" py={8} textAlign="center">Chargement…</Text>;
  }

  const roomNames = [...new Set(rooms.map((r) => r.name))];

  return (
    <Box>
      {/* Filters */}
      <Flex gap={3} mb={4} wrap="wrap">
        <Box flex={1} minW="160px">
          <Text fontSize="xs" color="text.muted" mb={1}>Salle</Text>
          <Box
            as="select"
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
            w="100%"
            p={1.5}
            borderRadius="md"
            fontSize="sm"
          >
            <option value="">Toutes les salles</option>
            {roomNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Box>
        </Box>
        <Box flex={1} minW="160px">
          <Text fontSize="xs" color="text.muted" mb={1}>Date</Text>
          <Input
            size="sm"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
          />
        </Box>
        <Box flex={1} minW="160px">
          <Text fontSize="xs" color="text.muted" mb={1}>Recherche</Text>
          <Input
            size="sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Titre, personne, salle…"
            bg="bg.primary"
            borderColor="border.default"
            color="text.primary"
            _focus={{ borderColor: "accent.default" }}
          />
        </Box>
      </Flex>

      {/* Table */}
      {filtered.length === 0 ? (
        <Text color="text.muted" py={8} textAlign="center">Aucune réservation trouvée</Text>
      ) : (
        <Box overflowX="auto">
          <Box as="table" w="100%" fontSize="sm" borderCollapse="collapse">
            <Box as="thead">
              <Box as="tr" color="text.muted" borderBottom="1px solid" borderColor="border.default">
                <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Date</Box>
                <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Salle</Box>
                <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Titre</Box>
                <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Personne</Box>
                <Box as="th" textAlign="left" px={3} py={2} fontWeight="medium">Horaire</Box>
                <Box as="th" textAlign="center" px={3} py={2} fontWeight="medium" w="60px"></Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filtered.map((r) => (
                <Box
                  as="tr"
                  key={r.uid}
                  borderBottom="1px solid"
                  borderColor="border.default"
                  _hover={{ bg: "bg.elevated" }}
                >
                  <Box as="td" px={3} py={2} color="text.primary">
                    {r.start?.slice(0, 10)}
                  </Box>
                  <Box as="td" px={3} py={2} color="text.primary">
                    {r.room}
                  </Box>
                  <Box as="td" px={3} py={2} color="text.primary">
                    {r.title}
                  </Box>
                  <Box as="td" px={3} py={2} color="text.secondary">
                    {r.reserved_by}
                  </Box>
                  <Box as="td" px={3} py={2} color="text.muted" fontSize="xs">
                    {r.start?.slice(-5)} – {r.end?.slice(-5)}
                  </Box>
                  <Box as="td" px={3} py={2} textAlign="center">
                    <Button
                      size="xs"
                      variant="ghost"
                      color="text.muted"
                      _hover={{ color: "#f87171" }}
                      onClick={() => setConfirmDelete(r)}
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
          <Text fontSize="xs" color="text.muted" mt={2}>
            {filtered.length} réservation{filtered.length > 1 ? "s" : ""}
          </Text>
        </Box>
      )}

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
            <Text fontWeight="bold" mb={3}>Supprimer la réservation ?</Text>
            <Text fontSize="sm" color="text.secondary" mb={4}>
              <strong>{confirmDelete.title}</strong> par <strong>{confirmDelete.reserved_by}</strong> le {confirmDelete.start?.slice(0, 10)} ({confirmDelete.start?.slice(-5)} – {confirmDelete.end?.slice(-5)})
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
                isLoading={deleting === confirmDelete.uid}
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
