import {
    Box,
    Badge,
    Text,
    VStack,
    HStack,
    Heading,
    Spinner,
    Flex
} from "@chakra-ui/react";

import {useClock} from "../hooks/useClock";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
    dayStart,
    dayEnd,
    getStatusColor,
    getRoomStatus,
    renderRoomTimeline
} from "../utils/timelineUtils";

// API Base URL from environment or fallback
const API_URL = import.meta.env.VITE_API_URL;


function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function isToday(dateStr) {
    const date = new Date(dateStr.replace(" ", "T"));
    const now = new Date();

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

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

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await fetch(`${API_URL}/api/room/fetch/all`);
                const data = await res.json();

                const filteredRooms = data.rooms.map((room) => ({
                    ...room,
                    reservations: room.reservations.filter((r) =>
                        isToday(r.start) && isInDayRange(r.start, r.end)
                    ),
                }));

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
            <Flex minH="100vh" justify="center" align="center" bg="#FFFFFF" color="#424B54">
                <Spinner size="xl" color="#9B6A6C" />
                <Text ml="10px">Chargement...</Text>
            </Flex>
        );
    }

    return (
        <Box minH="100vh" bg="#FFFFFF" color="#424B54">

            <Text color="#424B54" fontSize="xl" position="absolute" right="10px" top="10px" fontWeight="semibold">
                {time}
            </Text>

            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                h="120px"
            >
                <Heading size="2xl" color="#424B54" textAlign="center">
                    RoomIO
                </Heading>
            </Box>

            <Box p={6}>
                {renderRoomTimeline(rooms, time)}
            </Box>
        </Box>
    );
}