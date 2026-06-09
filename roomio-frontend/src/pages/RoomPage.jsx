import {useParams} from "react-router-dom";
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
import '../index.css'

const API_URL = import.meta.env.VITE_API_URL;

import {useClock} from "../hooks/useClock";
import {
    getStatusBg,
    getStatusColor,
    getRoomStatus,
    renderRoomTimeline
} from "../utils/timelineUtils";


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
    const time = useClock();

    const [room, setRoom] = useState(null);
    const [selectedDay, setSelectedDay] = useState(0); // Auto-select today
    const [isOpen, setOpen] = useState(false);
    const [reservationToDelete, setReservationToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // Reservation form state
    const [title, setTitle] = useState("");
    const [user, setUser] = useState("");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");

    useEffect(() => {
        const fetchRoom = async () => {
            const name = decodeURIComponent(roomName);
            const res = await fetch(
                `${API_URL}/api/room/fetch/name/${name}`
            );
            const data = await res.json();
            setRoom(data.room);
        };

        fetchRoom();
    }, [roomName]);

    const week = daysOfWeek();
    const selectedDate = week[selectedDay];

    // Set default date when Drawer opens
    const handleOpenDrawer = () => {
        const pad = (n) => String(n).padStart(2, "0");
        const dateStr =
            selectedDate.getFullYear() +
            "-" +
            pad(selectedDate.getMonth() + 1) +
            "-" +
            pad(selectedDate.getDate());
        setStartDate(dateStr);
        onOpen();
    };

    // Handle reservation submit
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
                // Refresh room data
                const roomRes = await fetch(
                    `${API_URL}/api/room/fetch/name/${encodeURIComponent(room.name)}`
                );
                const roomData = await roomRes.json();
                setRoom(roomData.room);

                // Reset form
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

    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== "Oui") return;
        try {
            const name = decodeURIComponent(roomName);
            const res = await fetch(
                `${API_URL}/api/reservation/remove/${encodeURIComponent(name)}/${reservationToDelete.uid}`,
                {
                    method: "POST"
                }
            );
            if (res.ok) {
                // Refresh room data
                const roomRes = await fetch(
                    `${API_URL}/api/room/fetch/name/${encodeURIComponent(name)}`
                );
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
            <Flex minH="100vh" align="center" justify="center" bg="#FFFFFF">
                <Spinner size="xl" color="#9B6A6C" />
                <Text color="#424B54" ml="10px">Chargement...</Text>
            </Flex>
        );


    return (
        <Box minH="100vh" bg="#FFFFFF" color="#424B54">

            {/* HEADER */}
            <Flex justify="space-between" align="center" p={4}>
                <Box>
                    <Heading size="lg" color="#424B54">{room.name}</Heading>

                </Box>

                <Text fontSize="xl" color="#424B54">{time}</Text>

                <Drawer.Root open={isOpen} onOpenChange={(e) => setOpen(e.open)}>
                    <Drawer.Trigger asChild>
                        <Button bg="#9B6A6C" color="white" size="sm" _hover={{ bg: "#8A5B5D" }}>
                            Reserver
                        </Button>
                    </Drawer.Trigger>

                    <Portal>
                        <Drawer.Positioner>
                            {/* Drawer content | resize as a small window*/}
                            <Drawer.Body color="#424B54" position="absolute" w="500px" h="auto" p={6} top="50%" left="50%" transform="translate(-50%, -50%)"
                                         bg="#FFFFFF" border="2px solid" borderColor="#93A8AC" rounded="xl" boxShadow="2xl">
                                <VStack spacing={4}>
                                    {/* Title */}
                                    <Box w="100%">
                                        <Text fontSize="sm" mb={2} fontWeight="bold">
                                            Titre
                                        </Text>
                                        <Input
                                            placeholder="Ex: Réunion équipe"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            bg="#FFFFFF"
                                            border="1px solid"
                                            borderColor="#93A8AC"
                                            color="#424B54"
                                            _focus={{borderColor: "#9B6A6C", outline: "none"}}
                                            _placeholder={{color: "gray.400"}}
                                        />
                                    </Box>

                                    {/* User */}
                                    <Box w="100%">
                                        <Text fontSize="sm" mb={2} fontWeight="bold">
                                            Nom
                                        </Text>
                                        <Input
                                            placeholder="Votre nom"
                                            value={user}
                                            onChange={(e) => setUser(e.target.value)}
                                            bg="#FFFFFF"
                                            border="1px solid"
                                            borderColor="#93A8AC"
                                            color="#424B54"
                                            _focus={{borderColor: "#9B6A6C", outline: "none"}}
                                            _placeholder={{color: "gray.400"}}
                                        />
                                    </Box>

                                    {/* Date */}
                                    <Box w="100%">
                                        <Text fontSize="sm" mb={2} fontWeight="bold">
                                            Date
                                        </Text>
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            bg="#FFFFFF"
                                            border="1px solid"
                                            borderColor="#93A8AC"
                                            color="#424B54"
                                            _focus={{borderColor: "#9B6A6C", outline: "none"}}
                                        />
                                    </Box>

                                    {/* Time pickers */}
                                    <HStack w="100%" spacing={4}>
                                        <Box flex={1}>
                                            <Text fontSize="sm" mb={2} fontWeight="bold">
                                                Heure de début
                                            </Text>
                                            <Input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                bg="#FFFFFF"
                                                border="1px solid"
                                                borderColor="#93A8AC"
                                                color="#424B54"
                                                _focus={{borderColor: "#9B6A6C", outline: "none"}}
                                            />
                                        </Box>

                                        <Box flex={1}>
                                            <Text fontSize="sm" mb={2} fontWeight="bold">
                                                Heure de fin
                                            </Text>
                                            <Input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                bg="#FFFFFF"
                                                border="1px solid"
                                                borderColor="#93A8AC"
                                                color="#424B54"
                                                _focus={{borderColor: "#9B6A6C", outline: "none"}}
                                            />

                                        </Box>
                                    </HStack>
                                </VStack>
                            </Drawer.Body>

                            <Drawer.CloseTrigger asChild>
                                <CloseButton/>
                            </Drawer.CloseTrigger>

                            <Drawer.Footer>

                                <Button bg="#9B6A6C" color="white" _hover={{ bg: "#8A5B5D" }} onClick={() => {
                                    if (handleSubmit()){
                                        setOpen(false)
                                    }
                                }}>
                                    Creer
                                    </Button>


                                    </Drawer.Footer>
                                    </Drawer.Positioner>
                                    </Portal>
                                    </Drawer.Root>

                                    </Flex>


                                {/* WEEK SELECTOR */
                                }
                                <HStack justify="center" spacing={3} mb={4}>
                                    {week.map((d, i) => (
                                        <Box
                                            key={i}
                                            px={3}
                                            py={2}
                                            bg={i === selectedDay ? "#9B6A6C" : "#93A8AC"}
                                            color="white"
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() => setSelectedDay(i)}
                                            transition="0.2s"
                                            _hover={{bg: "#9B6A6C"}}
                                        >
                                            <Text fontSize="sm">
                                                {d.toLocaleDateString("fr-FR", {weekday: "short"})}
                                            </Text>
                                        </Box>
                                    ))}
                                </HStack>

                                    {/* TIMELINE */
                                    }
                                <Box
                                    mx="auto"
                                    w="95%"
                                    bg="#FFFFFF"
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor="#93A8AC"
                                    p={6}
                                    mb={6}
                                    color="#424B54"
                                >
                                     <Badge mt={2} bg={getStatusBg(getRoomStatus(room.reservations))} color="white" px={2.5} py={0.5} borderRadius="md">
                                        {getRoomStatus(room.reservations)}
                                    </Badge>
                                    {/* Date header */}
                                    <Text fontSize="lg" mb={6} fontWeight="bold">
                                        {selectedDate.toLocaleDateString("fr-FR", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric"
                                        })}
                                    </Text>

                                     {/* Timeline */}
                                     {renderRoomTimeline([room], time, selectedDate, (res) => setReservationToDelete(res))}
                                 </Box>


            {/* Reservation Deletion Modal */}
            {reservationToDelete && (
                <Flex
                    position="fixed"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    bg="rgba(15, 23, 42, 0.4)"
                    backdropFilter="blur(4px)"
                    justify="center"
                    align="center"
                    zIndex={100}
                >
                    <Box
                        bg="#FFFFFF"
                        w="440px"
                        p={6}
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="#93A8AC"
                        boxShadow="2xl"
                        position="relative"
                    >
                        <CloseButton
                            position="absolute"
                            top="16px"
                            right="16px"
                            color="#424B54"
                            onClick={() => {
                                setReservationToDelete(null);
                                setDeleteConfirmText("");
                            }}
                        />

                        <Heading size="md" color="#424B54" mb={4}>
                            Supprimer la réservation
                        </Heading>

                        <Text fontSize="sm" color="#424B54" mb={6}>
                            Voulez-vous vraiment supprimer la réunion <strong>{reservationToDelete.title}</strong> de <strong>{reservationToDelete.reserved_by}</strong> ?
                            <br />
                            <br />
                            Pour éviter les erreurs, veuillez saisir <strong>"Oui"</strong> ci-dessous :
                        </Text>

                        <Input
                            placeholder='Écrivez "Oui"'
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            mb={6}
                            bg="#FFFFFF"
                            border="1px solid"
                            borderColor="#93A8AC"
                            color="#424B54"
                            _focus={{ borderColor: "#DC2626", outline: "none" }}
                        />

                        <HStack justify="end" spacing={3}>
                            <Button
                                variant="outline"
                                borderColor="#93A8AC"
                                color="#424B54"
                                onClick={() => {
                                    setReservationToDelete(null);
                                    setDeleteConfirmText("");
                                }}
                            >
                                Annuler
                            </Button>
                            <Button
                                bg="#DC2626"
                                color="white"
                                _hover={{ bg: "#B91C1C" }}
                                disabled={deleteConfirmText !== "Oui"}
                                onClick={handleDeleteConfirm}
                            >
                                Supprimer
                            </Button>
                        </HStack>
                    </Box>
                </Flex>
            )}

         </Box>
    )
        ;
}