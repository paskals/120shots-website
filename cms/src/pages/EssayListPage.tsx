import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useEssayStore } from "../stores/essay-store";
import EssayList from "../components/essays/EssayList";

export default function EssayListPage() {
  const { fetchEssays } = useEssayStore();

  useEffect(() => {
    fetchEssays();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b border-zinc-200 p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Essays</h2>
        <Link
          to="/essays/new"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          New Essay
        </Link>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <EssayList />
      </div>
    </div>
  );
}
