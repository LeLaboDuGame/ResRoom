import {
    Box,
    Badge,
    Text,
    VStack,
    HStack,
    Heading,
    Spinner,
    Flex,
    Input,
    Checkbox,
    Button
} from "@chakra-ui/react";

import {useClock} from "../hooks/useClock";
import {useEffect, useState, useRef} from "react";
import {useNavigate} from "react-router-dom";
import {
    dayStart,
    dayEnd,
    getStatusColor,
    getRoomStatus,
    renderRoomTimeline
} from "../utils/timelineUtils";
import { renderFloorPlan } from "../utils/floorPlan";

const API_URL = import.meta.env.VITE_API_URL;
const FILTER_INACTIVITY_MIN = 15;

function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/* Vérifie si la date d'une réservation est aujourd'hui */
function isToday(dateStr) {
    const date = new Date(dateStr.replace(" ", "T"));
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

/* Vérifie si une réservation chevauche la plage horaire d'ouverture */
function isInDayRange(startStr, endStr) {
    const start = new Date(startStr.replace(" ", "T"));
    const end = new Date(endStr.replace(" ", "T"));
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    return endHour >= dayStart && startHour <= dayEnd;
}


export default function RoomsList() {
    const time = useClock();
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    const navigate = useNavigate();

    // Filtres
    const [filterSize, setFilterSize] = useState("");
    const [filterCapacity, setFilterCapacity] = useState(0);
    const [filterTime, setFilterTime] = useState(time ? time.slice(0, 5) : "");
    const [filterDuration, setFilterDuration] = useState(60);
    const [filterTv, setFilterTv] = useState(false);
    const [filterWhiteboard, setFilterWhiteboard] = useState(false);
    const [filterComputer, setFilterComputer] = useState(false);

    // Reset automatique des filtres après inactivité
    const inactivityTimer = useRef(null);
    useEffect(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            setFilterSize("");
            setFilterCapacity(0);
            setFilterTime("");
            setFilterDuration(60);
            setFilterTv(false);
            setFilterWhiteboard(false);
            setFilterComputer(false);
        }, FILTER_INACTIVITY_MIN * 60 * 1000);
        return () => clearTimeout(inactivityTimer.current);
    }, [filterSize, filterCapacity, filterTime, filterDuration, filterTv, filterWhiteboard, filterComputer]);

    // Chargement des salles depuis l'API
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch(`${API_URL}/api/room/fetch/all`);
                const data = await res.json();

                // On ne garde que les réservations d'aujourd'hui dans la plage horaire
                const filteredRooms = data.rooms.map((room) => ({
                    ...room,
                    reservations: room.reservations.filter((r) =>
                        isToday(r.start) && isInDayRange(r.start, r.end)
                    ),
                }));

                // Calcul du statut en temps réel pour chaque salle
                const enrichedRooms = filteredRooms.map((room) => ({
                    ...room,
                    status: getRoomStatus(room.reservations),
                }));

                setRooms(enrichedRooms);
            } catch (err) {
                console.log(API_URL)
                console.error("API Error:\n", err);
                await wait(3000);
                fetchRooms();
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    if (loading) {
        return (
            <Flex minH="100vh" justify="center" align="center" bg="#1A202C" color="#E2E8F0">
                <Spinner size="xl" color="#9B6A6C" />
                <Text ml="10px">Chargement...</Text>
            </Flex>
        );
    }

    /* Vérifie si une salle est libre sur un créneau donné */
    function isRoomFreeAt(room, timeStr, durationMin = 60) {
        if (!room.reservations || !room.reservations.length) return true;
        const [h, m] = timeStr.split(":").map(Number);
        const startTotal = h + m / 60;
        const endTotal = startTotal + durationMin / 60;
        return !room.reservations.some((r) => {
            const resStart = new Date(r.start.replace(" ", "T"));
            const resEnd = new Date(r.end.replace(" ", "T"));
            const resStartH = resStart.getHours() + resStart.getMinutes() / 60;
            const resEndH = resEnd.getHours() + resEnd.getMinutes() / 60;
            return startTotal < resEndH && endTotal > resStartH;
        });
    }

    // Filtrage des salles selon les critères sélectionnés
    const sizeOrder = { small: 0, medium: 1, large: 2 };
    const filteredRooms = rooms.filter((room) => {
        if (filterSize && sizeOrder[room.size] < sizeOrder[filterSize]) return false;
        if (filterCapacity > 0 && (!room.elements || room.elements.capacity < filterCapacity)) return false;
        if (filterTv && (!room.elements || !room.elements.tv)) return false;
        if (filterWhiteboard && (!room.elements || !room.elements.whiteboard)) return false;
        if (filterComputer && (!room.elements || !room.elements.computer)) return false;
        if (filterTime && !isRoomFreeAt(room, filterTime, filterDuration)) return false;
        return true;
    });

    // Salles en surbrillance dans le plan si au moins un filtre est actif
    const hasActiveFilters = filterSize || filterCapacity > 0 || filterTv || filterWhiteboard || filterComputer || filterTime;
    const highlightedRooms = hasActiveFilters ? new Set(filteredRooms.map(r => r.name)) : null;

    return (
        <Box minH="100vh" bg="#1A202C">

            {/* Horloge */}
            <Text color="#424B54" fontSize="xl" position="absolute" right="10px" top="10px" fontWeight="semibold">
                {time}
            </Text>

            {/* Titre */}
            <Box display="flex" justifyContent="center" alignItems="center" h="120px">
                <Heading size="5xl" color="#424B54" textAlign="center" fontFamily="'Anta', sans-serif" letterSpacing="widest" fontWeight="extrabold">
                    RoomIO
                </Heading>
            </Box>

            <Box h="4px" bg="#424B54" opacity="0.3" mx={4} />

            <Box p={6}>
                {/* Panneau de filtres + timeline */}
                <Box bg="#FFFFFF" borderRadius="xl" border="1px solid" borderColor="#93A8AC" boxShadow="lg" p={6} mb={6} mt={6} color="#424B54">
                    {/* Filtres */}
                    <Flex flexWrap="wrap" gap={4} align="end" mb={6} pb={6} borderBottom="1px solid" borderColor="#93A8AC">
                        <Box>
                            <Text fontSize="xs" fontWeight="bold" mb={1} color="#424B54">Taille Min.</Text>
                            <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #93A8AC", background: "#FFFFFF", color: "#424B54", fontSize: "14px" }}>
                                <option value="">Toutes</option>
                                <option value="small">Petite</option>
                                <option value="medium">Moyenne</option>
                                <option value="large">Grande</option>
                            </select>
                        </Box>
                        <Box>
                            <Text fontSize="xs" fontWeight="bold" mb={1} color="#424B54">Capacité Min.</Text>
                            <Input size="sm" type="number" min={0} value={filterCapacity} onChange={(e) => setFilterCapacity(Number(e.target.value))} bg="#FFFFFF" borderColor="#93A8AC" color="#424B54" w="80px" />
                        </Box>
                        <Box>
                            <Text fontSize="xs" fontWeight="bold" mb={1} color="#424B54">Dispo à</Text>
                            <HStack gap={2}>
                                <Input size="sm" type="time" value={filterTime} onChange={(e) => setFilterTime(e.target.value)} bg="#FFFFFF" borderColor="#93A8AC" color="#424B54" />
                                <Text fontSize="sm" color="#424B54">pour</Text>
                                <select value={filterDuration} onChange={(e) => setFilterDuration(Number(e.target.value))} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #93A8AC", background: "#FFFFFF", color: "#424B54", fontSize: "14px" }}>
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={60}>1h</option>
                                    <option value={90}>1h30</option>
                                    <option value={120}>2h</option>
                                    <option value={180}>3h</option>
                                    <option value={240}>4h</option>
                                </select>
                            </HStack>
                        </Box>
                        <Box>
                            <Text fontSize="xs" fontWeight="bold" mb={1} color="#424B54">Équipement</Text>
                            <HStack gap={3}>
                                <Checkbox.Root size="sm" checked={filterTv} onCheckedChange={(e) => setFilterTv(e.checked)}>
                                    <Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label fontSize="sm" color="#424B54">📺 TV</Checkbox.Label>
                                </Checkbox.Root>
                                <Checkbox.Root size="sm" checked={filterWhiteboard} onCheckedChange={(e) => setFilterWhiteboard(e.checked)}>
                                    <Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label fontSize="sm" color="#424B54">📋 Tableau</Checkbox.Label>
                                </Checkbox.Root>
                                <Checkbox.Root size="sm" checked={filterComputer} onCheckedChange={(e) => setFilterComputer(e.checked)}>
                                    <Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label fontSize="sm" color="#424B54">💻 PC</Checkbox.Label>
                                </Checkbox.Root>
                            </HStack>
                        </Box>
                        <Box>
                            <Text fontSize="xs" mb={1}>&nbsp;</Text>
                            <Button size="sm" variant="outline" borderColor="#93A8AC" color="#424B54" onClick={() => {
                                setFilterSize("");
                                setFilterCapacity(0);
                                setFilterTime("");
                                setFilterDuration(60);
                                setFilterTv(false);
                                setFilterWhiteboard(false);
                                setFilterComputer(false);
                            }}>Réinitialiser</Button>
                        </Box>
                    </Flex>

                    {renderRoomTimeline(filteredRooms, time, null, null, [
                        ["#9B6A6C", "#E2B4BD"],
                        ["#2B6CB0", "#BEE3F8"],
                        ["#B7791F", "#FEFCBF"],
                        ["#276749", "#C6F6D5"],
                        ["#805AD5", "#E9D8FD"],
                        ["#C05621", "#FEEBCB"],
                        ["#319795", "#B2F5EA"],
                    ])}
                </Box>

                {/* Plan du bâtiment */}
                <Box mx="auto" w="100%" bg="#FFFFFF" borderRadius="xl" border="1px solid" borderColor="#93A8AC" boxShadow="lg" p={6} mb={6} mt={6} color="#424B54">
                    {renderFloorPlan(rooms, null, highlightedRooms)}
                </Box>
            </Box>
        </Box>
    );
}
