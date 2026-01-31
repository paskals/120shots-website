import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useEssayStore } from "../stores/essay-store";
import EssayEditor from "../components/essays/EssayEditor";

export default function EssayEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchEssay, current, loading, save, dirty, saving } =
    useEssayStore();

  useEffect(() => {
    if (id) fetchEssay(id);
  }, [id]);

  // Ctrl+S save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving && current?.title.trim()) save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saving, save, current]);

  // Unsaved changes warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        Loading...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        Essay not found
      </div>
    );
  }

  return <EssayEditor />;
}
