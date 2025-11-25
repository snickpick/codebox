import { useState, useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";

// Configure Monaco loader
loader.config({ monaco });

interface CodeEditorProps {
  selectedFile: string | null;
  containerId: string | null;
}

export function CodeEditor({ selectedFile, containerId }: CodeEditorProps) {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const ws = useRef<WebSocket | null>(null);

  // Determine language based on file extension
  const getLanguage = (filename: string | null): string => {
    if (!filename) return "plaintext";

    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "ts":
        return "typescript";
      case "tsx":
        return "typescript";
      case "js":
        return "javascript";
      case "jsx":
        return "javascript";
      case "json":
        return "json";
      case "css":
        return "css";
      case "html":
        return "html";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  useEffect(() => {
    if (!containerId) return;

    ws.current = new WebSocket("ws://localhost:3000/file-tree");

    ws.current.onopen = () => {
      console.log("Connected to file tree WS for editor");
      if (selectedFile) {
        ws.current?.send(JSON.stringify({
          type: "getFileContent",
          containerId,
          path: selectedFile
        }));
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "fileContent" && data.path === selectedFile) {
        if (editor) {
          const model = editor.getModel();
          if (model && model.getValue() !== data.content) {
            // Only update if content is different to avoid cursor jumping if we were typing (though we only fetch on select)
            // Actually, we should only set value if it's a fresh load.
            // For now, simple setValue is fine as we assume single user.
            editor.setValue(data.content);
          }
        }
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [containerId]);

  // Fetch content when selectedFile changes
  useEffect(() => {
    if (selectedFile && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "getFileContent",
        containerId,
        path: selectedFile
      }));
    }
  }, [selectedFile, containerId]);

  // Configure Monaco Editor
  useEffect(() => {
    if (monacoEl.current) {
      const newEditor = monaco.editor.create(monacoEl.current, {
        value: "// Select a file to start editing",
        language: "plaintext",
        theme: "vs-light",
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 1.5,
        fontFamily: "Menlo, Monaco, 'Courier New', monospace",
        tabSize: 2,
        insertSpaces: true,
        wordWrap: "on",
        lineNumbers: "on",
        folding: true,
        scrollBeyondLastLine: false,
        renderLineHighlight: "all",
        matchBrackets: "always",
        autoIndent: "full",
        suggestOnTriggerCharacters: true,
        wordBasedSuggestions: "currentDocument",
        parameterHints: { enabled: true },
        quickSuggestions: true,
      });

      setEditor(newEditor);

      // Add Save Command (Ctrl+S / Cmd+S)
      newEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (selectedFile && ws.current?.readyState === WebSocket.OPEN) {
          const content = newEditor.getValue();
          ws.current.send(JSON.stringify({
            type: "saveFile",
            containerId,
            path: selectedFile,
            content
          }));
          console.log("File saved");
        }
      });

      return () => {
        newEditor.dispose();
      };
    }
  }, []); // Empty dependency array - only run once

  // Update editor language when selectedFile changes
  useEffect(() => {
    if (editor) {
      // Update language mode
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, getLanguage(selectedFile));
      }
    }
  }, [selectedFile, editor]);

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex items-center px-4 py-2 bg-card border-b border-border">
        <span className="text-sm text-foreground font-medium">
          {selectedFile ? selectedFile.split('/').pop() : "No file selected"}
          {selectedFile && <span className="text-muted-foreground font-normal ml-2">({getLanguage(selectedFile)})</span>}
        </span>
      </div>
      <div className="flex-1 relative">
        <div
          ref={monacoEl}
          className="w-full h-full"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
