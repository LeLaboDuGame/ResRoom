import { usePlan } from "../hooks/usePlan";
import { Clock } from "../components/ui/Clock";
import { StatusBadge } from "../components/ui/StatusBadge";
import { FilterBar } from "../components/ui/FilterBar";

export default function Dashboard() {
  const { background, walls, roomPolygons, loading } = usePlan();

  if (loading) return <p>Chargement du plan...</p>;

  return (
    <div>
      <p>Murs : {walls.length}</p>
      <p>Salles : {Object.keys(roomPolygons).length}</p>
        <Clock />
        <StatusBadge/>
        <FilterBar/>
    </div>
  );
}