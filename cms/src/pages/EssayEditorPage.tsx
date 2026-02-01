import { useCallback, useEffect } from "react";
import { useParams, useBlocker } from "react-router-dom";
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

  // Unsaved changes warning (browser tab close / external navigation)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Block in-app navigation when dirty
  const blocker = useBlocker(
    useCallback(() => dirty, [dirty])
  );

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

  return (
    <>
      <EssayEditor />
      {blocker.state === "blocked" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900">Unsaved changes</h3>
            <p className="text-sm text-zinc-600">
              You have unsaved changes that will be lost if you leave this page.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => blocker.reset?.()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={() => blocker.proceed?.()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
