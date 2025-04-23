import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface DescriptionTooltipProps {
  title: string;
  examples: readonly string[];
  tips: readonly string[];
}

export function DescriptionTooltip({ title, examples, tips }: DescriptionTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center text-gray-500 hover:text-gray-700">
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-80 p-4" side="right">
          <div className="space-y-4">
            <h3 className="font-medium">{title}</h3>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Examples:</h4>
              <ul className="list-disc pl-4 space-y-1">
                {examples.map((example, i) => (
                  <li key={i} className="text-sm">{example}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tips:</h4>
              <ul className="list-disc pl-4 space-y-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-sm">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 