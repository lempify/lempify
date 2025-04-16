import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

const CreateSiteForm = ({ onRefresh }: { onRefresh: () => void }) => {
  const [name, setName] = useState("");
  const [ssl, setSsl] = useState(false);
  const [laravel, setLaravel] = useState(false);
  const [wordpress, setWordpress] = useState(false);
  const [status, setStatus] = useState<"idle" | "creating" | "success" | "error">("idle");
  const [result, setResult] = useState<string | null>(null);

  const handleCreate = async () => {
    setStatus("creating");
    try {
      const domain = await invoke<string>("create_site", { payload: { name, ssl, wordpress, laravel } });
      setResult(domain);
      setStatus("success");
      onRefresh();
    } catch (err) {
      console.error("Failed to create site:", err);
      setStatus("error");
    }
  };

  return (
    <div className="mb-20 p-10 w-full border border-neutral-200 dark:border-neutral-700 rounded-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Create New Site</h2>
        <button onClick={onRefresh} className="btn">Refresh</button>
      </div>
      <input
        type="url"
        placeholder="lempify.local"
        className="border border-neutral-200 placeholder:text-neutral-300 placeholder:italic focus:border-neutral-300 outline-none dark:border-neutral-700 w-full mb-4 px-4 py-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex items-center gap-2 mb-4 text-sm">
        <label className="mr-4">
          <input
            type="checkbox"
            className="form-checkbox rounded text-pink-500 mr-2"
            checked={ssl}
            onChange={(e) => setSsl(e.target.checked)}
          /><span>SSL?</span>
        </label>
        <label className="mr-4">
          <input
            type="checkbox"
            className="form-checkbox rounded text-pink-500 mr-2"
            checked={laravel}
            onChange={(e) => setLaravel(e.target.checked)}
          /><span>Laravel?</span>
        </label>
        <label>
          <input
            type="checkbox"
            className="form-checkbox rounded text-pink-500 mr-2"
            checked={wordpress}
            onChange={(e) => setWordpress(e.target.checked)}
          />
          <span>WordPress?</span>
        </label>
      </div>
      <button
        onClick={handleCreate}
        className="bg-[var(--lempify-primary)] hover:bg-[var(--lempify-primary-700)] text-white px-4 py-2 rounded disabled:opacity-50 disabled:bg-neutral-400"
        disabled={!name || status === "creating"}
      >
        {status === "creating" ? "Creating..." : "Create Site"}
      </button>
      {status === "success" && result && (
        <p className="mt-2 text-green-600">
          🚀 Created:{" "}
          <a href={`http://${result}`} target="_blank" rel="noopener noreferrer">
            {result}
          </a>
        </p>
      )}
      {status === "error" && (
        <p className="mt-2 text-red-600">❌ Something went wrong</p>
      )}
    </div>
  );
};

export default CreateSiteForm;