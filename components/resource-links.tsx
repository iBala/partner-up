import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, X, Link as LinkIcon } from "lucide-react";
import { ResourceLink } from "@/app/dashboard/jobs/new/types";

interface ResourceLinksProps {
  links: ResourceLink[];
  onChange: (links: ResourceLink[]) => void;
  examples: readonly string[];
}

export function ResourceLinks({ links, onChange, examples }: ResourceLinksProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const handleAdd = () => {
    if (name.trim() && url.trim()) {
      onChange([...links, { name: name.trim(), url: url.trim() }]);
      setName("");
      setUrl("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-md bg-secondary"
          >
            <LinkIcon className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="font-medium text-sm">{link.name}</div>
              <div className="text-sm text-gray-500 truncate">{link.url}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <Input
          placeholder="Resource name (e.g., GitHub Repository)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={!name.trim() || !url.trim()}
          className="w-full"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {examples.length > 0 && (
        <div className="text-sm text-gray-500">
          <div className="font-medium mb-1">Suggested resources:</div>
          <ul className="list-disc pl-4 space-y-1">
            {examples.map((example, i) => (
              <li key={i}>{example}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 