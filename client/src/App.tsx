import { useState, useEffect } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "./components/ui/button";
import { FileTree } from "./components/file-tree";
import { CodeEditor } from "./components/code-editor";
import { Terminal } from "./components/terminal";
import { PreviewPane } from "./components/preview-pane";

export default function CodeSandboxUI() {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    "src/App.tsx",
  );
  const [isFileTreeVisible, setIsFileTreeVisible] = useState(true);
  const [, setProjectId] = useState<string | null>(null);
  const [containerId, setContainerId] = useState<string | null>(null);

  useEffect(() => {
    const initProject = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const pid = urlParams.get("projectId");

      if (pid) {
        try {
          const response = await fetch(`http://localhost:3000/projects/${pid}`, {
            method: "POST",
          });
          const data = await response.json();
          setProjectId(data.projectId);
          setContainerId(data.containerId);
        } catch (e) {
          console.error("Failed to load project", e);
        }
      } else {
        try {
          const response = await fetch("http://localhost:3000/create-new-project", {
            method: "POST",
          });
          const data = await response.json();
          setProjectId(data.projectId);
          setContainerId(data.containerId);
          window.history.replaceState(null, "", `?projectId=${data.projectId}`);
        } catch (e) {
          console.error("Failed to create project", e);
        }
      }
    };
    initProject();
  }, []);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-12 bg-card border-b border-border flex items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFileTreeVisible(!isFileTreeVisible)}
          className="h-8 px-2"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">
              CS
            </span>
          </div>
          <span className="font-semibold text-foreground">codebox</span>
        </div>
        <div className="flex-1" />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        {isFileTreeVisible && (
          <div className="w-64 flex-shrink-0">
            <FileTree
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              containerId={containerId}
            />
          </div>
        )}

        <div className="flex-1 flex relative">
          {/* Code Editor - now draggable */}
          <div className="flex-1 flex flex-col relative">
            <CodeEditor selectedFile={selectedFile} containerId={containerId} />
            {/* Terminal */}
            <div className="h-48 flex-shrink-0">
              <Terminal containerId={containerId} />
            </div>
          </div>

          {/* Preview Pane - already draggable */}
          <div className="w-96 flex-shrink-0 border-l border-border">
            <PreviewPane />
          </div>
        </div>
      </div>
    </div>
  );
}
