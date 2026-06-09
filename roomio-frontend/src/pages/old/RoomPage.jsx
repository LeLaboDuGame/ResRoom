import {useParams, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {
    DatePicker,
    Box,
    Text,
    Flex,
    Heading,
    Button,
    VStack,
    HStack,
    Input,
    useDisclosure,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    DrawerCloseTrigger,
    Badge, DrawerBackdrop,
    Portal,
    CloseButton,
    Spinner
} from "@chakra-ui/react";
import '../../index.css'

const API_URL = import.meta.env.VITE_API_URL;

import {useClock} from "../../hooks/useClock.js";
import {
    getStatusBg,
    getStatusColor,
    getRoomStatus,
    renderRoomTimeline
} from "../../utils/timelineUtils.jsx";
import { renderFloorPlan } from "../../utils/floorPlan.jsx";
import colors from "../../config/colorTheme.jsx";


/* Génère les 7 prochains jours à partir d'aujourd'hui */
function daysOfWeek() {
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
}


export default function RoomPage() {
    const {roomName} = useParams();
    const navigate = useNavigate();
    const time = useClock();
    const pad = (n) => String(n).padStart(2, "0");
    const today = new Date();

    const [room, setRoom] = useState(null);
    const [selectedDay, setSelectedDay] = useState(0); // Jour sélectionné dans le sélecteur de semaine
    const [isOpen, setOpen] = useState(false); // Drawer de réservation
    const [reservationToDelete, setReservationToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // Formulaire de réservation
    const [title, setTitle] = useState("");
    const [user, setUser] = useState("");
    const [startDate, setStartDate] = useState(
        today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate())
    );
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");

    // Quand l'heure de début change, l'heure de fin est auto-incrémentée de 1h
    const handleStartTimeChange = (e) => {
        const val = e.target.value;
        setStartTime(val);
        const [h, m] = val.split(":").map(Number);
        const endH = (h + 1) % 24;
        setEndTime(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    };

    // Chargement de la salle depuis l'API
    useEffect(() => {
        const fetchRoom = async () => {
            const name = decodeURIComponent(roomName);
            const res = await fetch(`${API_URL}/api/room/fetch/name/${name}`);
            const data = await res.json();
            setRoom(data.room);
        };
        fetchRoom();
    }, [roomName]);

    const week = daysOfWeek();
    const selectedDate = week[selectedDay];

    // Met à jour la date du drawer avec le jour sélectionné
    useEffect(() => {
        if (!isOpen) return;
        setStartDate(
            selectedDate.getFullYear() +
            "-" + pad(selectedDate.getMonth() + 1) +
            "-" + pad(selectedDate.getDate())
        );
    }, [isOpen]);

    // Création d'une réservation
    const handleSubmit = async () => {
        if (!title || !user || !startTime || !endTime) {
            alert("Veuillez remplir tous les champs");
            return false;
        }

        const startStr = `${startDate} ${startTime}`;
        const endStr = `${startDate} ${endTime}`;
        try {
            const res = await fetch(
                `${API_URL}/api/reservation/create/${encodeURIComponent(room.name)}`,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        title,
                        reserved_by: user,
                        start: startStr,
                        end: endStr,
                    }),
                }
            );

            if (res.ok) {
                // Recharge la salle pour voir la nouvelle réservation
                const roomRes = await fetch(`${API_URL}/api/room/fetch/name/${encodeURIComponent(room.name)}`);
                const roomData = await roomRes.json();
                setRoom(roomData.room);

                // Réinitialise le formulaire
                setTitle("");
                setUser("");
                setStartTime("09:00");
                setEndTime("10:00");
                return true;
            } else {
                const error = await res.json();
                alert(`Erreur: ${error.detail}`);
                return false;
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Erreur lors de la création de la réservation:\n err");
            return false;
        }
    };

    // Suppression d'une réservation
    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== "Oui") return;
        try {
            const name = decodeURIComponent(roomName);
            const res = await fetch(
                `${API_URL}/api/reservation/remove/${encodeURIComponent(name)}/${reservationToDelete.uid}`,
                { method: "POST" }
            );
            if (res.ok) {
                const roomRes = await fetch(`${API_URL}/api/room/fetch/name/${encodeURIComponent(name)}`);
                const roomData = await roomRes.json();
                setRoom(roomData.room);
                setReservationToDelete(null);
                setDeleteConfirmText("");
            } else {
                const data = await res.json();
                alert(`Erreur lors de la suppression: ${data.detail || "Inconnue"}`);
            }
        } catch (e) {
            console.error("Delete Error:", e);
            alert("Erreur lors de la suppression de la réservation");
        }
    };

    if (!room)
        return (
            <Flex minH="100vh" align="center" justify="center" bg={colors.PAGE_BG}>
                <Spinner size="xl" color={colors.SPINNER_COLOR} />
                <Text color={colors.TEXT_PRIMARY} ml="10px">Chargement...</Text>
            </Flex>
        );


    return (
        <Box minH="100vh" bg={colors.PAGE_BG}>

            {/* Titre + bouton retour */}
            <Box position="relative" display="flex" justifyContent="center" alignItems="center" h="120px">
                <Button
                    position="absolute"
                    left="20px"
                    top="50%"
                    transform="translateY(-50%)"
                    bg={colors.BUTTON_BACK_BG}
                    color={colors.BUTTON_BACK_COLOR}
                    borderRadius="full"
                    p={2}
                    minW="40px"
                    h="40px"
                    _hover={{ bg: colors.BUTTON_BACK_HOVER }}
                    onClick={() => navigate("/")}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.BUTTON_BACK_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5m7-7-7 7 7 7"/>
                    </svg>
                </Button>
                <Heading size="5xl" color={colors.TEXT_PRIMARY} textAlign="center" fontFamily="'Anta', sans-serif" letterSpacing="widest" fontWeight="extrabold">
                    RoomIO
                </Heading>
            </Box>

            <Box h="4px" bg={colors.DIVIDER} opacity="0.3" mx={4} />

            {/* En-tête : nom de la salle + horloge */}
            <Flex justify="space-between" align="center" p={4}>
                <Box>
                    <Heading size="4xl" color={colors.TEXT_ON_DARK}>{room.name}</Heading>
                </Box>
                <Text fontSize="xl" color={colors.CARD_BORDER}>{time}</Text>
            </Flex>

            {/* Sélecteur de jour (semaine) */}
            <HStack justify="center" spacing={3} mb={4}>
                {week.map((d, i) => (
                    <Box
                        key={i}
                        px={3}
                        py={2}
                        bg={i === selectedDay ? colors.DAY_PILL_SELECTED : colors.DAY_PILL_DEFAULT}
                        color={colors.DAY_PILL_TEXT}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => setSelectedDay(i)}
                        transition="0.2s"
                        _hover={{bg: colors.DAY_PILL_HOVER}}
                    >
                        <Text fontSize="sm">
                            {d.toLocaleDateString("fr-FR", {weekday: "short"})}
                        </Text>
                    </Box>
                ))}
            </HStack>

            {/* Timeline + réservation + infos salle */}
            <Box mx="auto" w="95%" bg={colors.CARD_BG} borderRadius="xl" border="1px solid" borderColor={colors.CARD_BORDER} p={6} mb={6} color={colors.TEXT_PRIMARY}>
                <Badge mt={2} bg={getStatusBg(getRoomStatus(room.reservations))} color={colors.BADGE_TEXT} px={2.5} py={0.5} borderRadius="md">
                    {getRoomStatus(room.reservations)}
                </Badge>

                {/* Date + bouton Réserver */}
                <Flex justify="space-between" align="center" mb={6}>
                    <Text fontSize="lg" fontWeight="bold">
                        {selectedDate.toLocaleDateString("fr-FR", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric"
                        })}
                    </Text>

                    <Drawer.Root open={isOpen} onOpenChange={(e) => setOpen(e.open)}>
                        <Drawer.Trigger asChild>
                            <Button bg={colors.BUTTON_PRIMARY_BG} color={colors.BUTTON_PRIMARY_COLOR} size="sm" _hover={{ bg: colors.BUTTON_PRIMARY_HOVER }}>
                                Reserver
                            </Button>
                        </Drawer.Trigger>

                        <Portal>
                            <Drawer.Positioner>
                                <Drawer.Body color={colors.TEXT_PRIMARY} position="absolute" w="500px" h="auto" p={6} top="50%" left="50%" transform="translate(-50%, -50%)"
                                             bg={colors.CARD_BG} border="2px solid" borderColor={colors.CARD_BORDER} rounded="xl" boxShadow="2xl">
                                    <Flex justify="flex-end" mb={2}>
                                        <CloseButton onClick={() => setOpen(false)} />
                                    </Flex>

                                    <VStack spacing={4}>
                                        <Box w="100%">
                                            <Text fontSize="sm" mb={2} fontWeight="bold">Titre</Text>
                                            <Input placeholder="Ex: Réunion équipe" value={title}
                                                   onChange={(e) => setTitle(e.target.value)}
                                                   bg={colors.INPUT_BG} border="1px solid" borderColor={colors.INPUT_BORDER} color={colors.INPUT_COLOR}
                                                   _focus={{borderColor: colors.INPUT_FOCUS_BORDER, outline: "none"}}
                                                   _placeholder={{color: colors.INPUT_PLACEHOLDER}} />
                                        </Box>
                                        <Box w="100%">
                                            <Text fontSize="sm" mb={2} fontWeight="bold">Nom</Text>
                                            <Input placeholder="Votre nom" value={user}
                                                   onChange={(e) => setUser(e.target.value)}
                                                   bg={colors.INPUT_BG} border="1px solid" borderColor={colors.INPUT_BORDER} color={colors.INPUT_COLOR}
                                                   _focus={{borderColor: colors.INPUT_FOCUS_BORDER, outline: "none"}}
                                                   _placeholder={{color: colors.INPUT_PLACEHOLDER}} />
                                        </Box>
                                        <Box w="100%">
                                            <Text fontSize="sm" mb={2} fontWeight="bold">Date</Text>
                                            <Input type="date" value={startDate}
                                                   onChange={(e) => setStartDate(e.target.value)}
                                                   bg={colors.INPUT_BG} border="1px solid" borderColor={colors.INPUT_BORDER} color={colors.INPUT_COLOR}
                                                   _focus={{borderColor: colors.INPUT_FOCUS_BORDER, outline: "none"}} />
                                        </Box>
                                        <Box w="100%">
                                            <Text fontSize="sm" mb={2} fontWeight="bold">Heure de début</Text>
                                            <Input type="time" value={startTime}
                                                   onChange={handleStartTimeChange}
                                                   bg={colors.INPUT_BG} border="1px solid" borderColor={colors.INPUT_BORDER} color={colors.INPUT_COLOR}
                                                   _focus={{borderColor: colors.INPUT_FOCUS_BORDER, outline: "none"}} />
                                        </Box>
                                        <Box w="100%">
                                            <Text fontSize="sm" mb={2} fontWeight="bold">Heure de fin</Text>
                                            <Input type="time" value={endTime}
                                                   onChange={(e) => setEndTime(e.target.value)}
                                                   bg={colors.INPUT_BG} border="1px solid" borderColor={colors.INPUT_BORDER} color={colors.INPUT_COLOR}
                                                   _focus={{borderColor: colors.INPUT_FOCUS_BORDER, outline: "none"}} />
                                        </Box>
                                        <Button bg={colors.BUTTON_PRIMARY_BG} color={colors.BUTTON_PRIMARY_COLOR} size="md" w="100%"
                                                _hover={{ bg: colors.BUTTON_PRIMARY_HOVER }} onClick={handleSubmit}>
                                            Creer
                                        </Button>
                                    </VStack>
                                </Drawer.Body>
                            </Drawer.Positioner>
                        </Portal>
                    </Drawer.Root>
                </Flex>

                {/* Timeline des réservations */}
                {renderRoomTimeline([room], time, selectedDate, (res) => setReservationToDelete(res))}

                {/* Équipements et caractéristiques de la salle */}
                {room.elements && (
                <Box mt={6} pt={6} borderTop="1px solid" borderColor={colors.CARD_BORDER}>
                    <Flex flexWrap="wrap" gap={4} align="center">
                        {room.size === "large" && <Flex align="center" gap={2}><Text fontSize="xl">🏢</Text><Text fontSize="sm">Grande salle</Text></Flex>}
                        {room.size === "medium" && <Flex align="center" gap={2}><Text fontSize="xl">🏠</Text><Text fontSize="sm">Salle moyenne</Text></Flex>}
                        {room.size === "small" && <Flex align="center" gap={2}><Text fontSize="xl">🚪</Text><Text fontSize="sm">Petite salle</Text></Flex>}
                        <Flex align="center" gap={2}><Text fontSize="xl">👥</Text><Text fontSize="sm">{room.elements.capacity} personnes</Text></Flex>
                        {room.elements.tv && <Flex align="center" gap={2}><Text fontSize="xl">📺</Text><Text fontSize="sm">TV</Text></Flex>}
                        {room.elements.whiteboard && <Flex align="center" gap={2}><Text fontSize="xl">📋</Text><Text fontSize="sm">Tableau blanc</Text></Flex>}
                        {room.elements.computer && <Flex align="center" gap={2}><Text fontSize="xl">💻</Text><Text fontSize="sm">Ordinateur</Text></Flex>}
                    </Flex>
                </Box>
                )}
            </Box>

            {/* Plan du bâtiment */}
            <Box mx="auto" w="95%" bg={colors.CARD_BG} borderRadius="xl" border="1px solid" borderColor={colors.CARD_BORDER} boxShadow="lg" p={6} mb={6} mt={6} color={colors.TEXT_PRIMARY}>
                {renderFloorPlan([room], room.name)}
            </Box>

            {/* Modale de confirmation de suppression */}
            {reservationToDelete && (
                <Flex position="fixed" top="0" left="0" right="0" bottom="0"
                      bg={colors.OVERLAY} backdropFilter="blur(4px)"
                      justify="center" align="center" zIndex={100}>
                    <Box bg={colors.CARD_BG} w="440px" p={6} borderRadius="xl" border="1px solid" borderColor={colors.CARD_BORDER} boxShadow="2xl" position="relative">
                        <CloseButton position="absolute" top="16px" right="16px" color={colors.TEXT_PRIMARY}
                                     onClick={() => { setReservationToDelete(null); setDeleteConfirmText(""); }} />
                        <Heading size="md" color={colors.TEXT_PRIMARY} mb={4}>Supprimer la réservation</Heading>
                        <Text fontSize="sm" color={colors.TEXT_PRIMARY} mb={6}>
                            Voulez-vous vraiment supprimer la réunion <strong>{reservationToDelete.title}</strong> de <strong>{reservationToDelete.reserved_by}</strong> ?
                            <br /><br />
                            Pour éviter les erreurs, veuillez saisir <strong>"Oui"</strong> ci-dessous :
                        </Text>
                        <Input placeholder='Écrivez "Oui"' value={deleteConfirmText}
                               onChange={(e) => setDeleteConfirmText(e.target.value)} mb={6}
                               bg={colors.CARD_BG} border="1px solid" borderColor={colors.CARD_BORDER} color={colors.TEXT_PRIMARY}
                               _focus={{ borderColor: colors.DANGER_FOCUS, outline: "none" }} />
                        <HStack justify="end" spacing={3}>
                            <Button variant="outline" borderColor={colors.BUTTON_OUTLINE_BORDER} color={colors.BUTTON_OUTLINE_COLOR}
                                    onClick={() => { setReservationToDelete(null); setDeleteConfirmText(""); }}>
                                Annuler
                            </Button>
                            <Button bg={colors.DANGER} color={colors.BADGE_TEXT} _hover={{ bg: colors.DANGER_HOVER }}
                                    disabled={deleteConfirmText !== "Oui"} onClick={handleDeleteConfirm}>
                                Supprimer
                            </Button>
                        </HStack>
                    </Box>
                </Flex>
            )}

         </Box>
    );
}
