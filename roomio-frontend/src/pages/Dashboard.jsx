import { usePlan } from "../hooks/usePlan";

export default function Dashboard() {
  const { background, walls, roomPolygons, loading } = usePlan();

  if (loading) return <p>Chargement du plan...</p>;

  return (
    <div>
      <p>Murs : {walls.length}</p>
      <p>Salles : {Object.keys(roomPolygons).length}</p>
    </div>
  );
}