import {usePlan} from "../hooks/usePlan";
import {Clock} from "../components/ui/Clock";
import {StatusBadge} from "../components/ui/StatusBadge";
import {FilterBar} from "../components/ui/FilterBar";
import {LoadingSkeleton} from "../components/ui/LoadingSkeleton";
import {EmptyState} from "../components/ui/EmptyState";
import {FloorPlan} from "../components/floorplan/FloorPlan.jsx";

/**
 * Main dashboard page.
 * Shows floor plan stats, widgets, and component tests.
 * @return {JSX.Element} Dashboard page
 */
export default function Dashboard() {
    const {background, walls, roomPolygons, loading} = usePlan();

    if (loading) return <p>Loading plan...</p>;

    return (
        <div>
            <p>Walls: {walls.length}</p>
            <p>Rooms: {Object.keys(roomPolygons).length}</p>
            <Clock/>
            <StatusBadge/>
            <FilterBar/>

            <div>
                <LoadingSkeleton variant="card" mb={4}/>
                <LoadingSkeleton variant="text" mb={2}/>
                <LoadingSkeleton variant="circle"/>
            </div>
            <EmptyState title={"Title"} description={"TEST"}/>
            <FloorPlan onRoomClick={() => console.log("Room clicked!")} walls={walls} roomPolygons={roomPolygons} selectedRoom={"Youri Gargarine"}/>
        </div>
    );
}
