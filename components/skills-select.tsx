import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SkillCategory {
  readonly category: string;
  readonly skills: readonly string[];
}

interface SkillsSelectProps {
  categories: readonly SkillCategory[];
  maxSkills: number;
  selectedSkills: string[];
  customSkill: string;
  onSkillsChange: (skills: string[]) => void;
  onCustomSkillChange: (skill: string) => void;
}

export function SkillsSelect({
  categories,
  maxSkills,
  selectedSkills,
  customSkill,
  onSkillsChange,
  onCustomSkillChange,
}: SkillsSelectProps) {
  const [customSkillInput, setCustomSkillInput] = useState("");

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < maxSkills) {
      onSkillsChange([...selectedSkills, skill]);
    }
  };

  const handleCustomSkillAdd = () => {
    if (customSkillInput.trim() && !customSkill) {
      onCustomSkillChange(customSkillInput.trim());
      setCustomSkillInput("");
    }
  };

  const handleCustomSkillRemove = () => {
    onCustomSkillChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedSkills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {skill}
            <button
              type="button"
              onClick={() => handleSkillToggle(skill)}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {customSkill && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-blue-100"
          >
            {customSkill}
            <button
              type="button"
              onClick={handleCustomSkillRemove}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      <div className="text-sm text-gray-500">
        {selectedSkills.length}/{maxSkills} skills selected
      </div>

      <Accordion type="single" collapsible className="w-full">
        {categories.map((category) => (
          <AccordionItem key={category.category} value={category.category}>
            <AccordionTrigger>{category.category}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2 p-2">
                {category.skills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`text-left px-3 py-2 rounded-md text-sm ${
                      selectedSkills.includes(skill)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    } ${
                      selectedSkills.length >= maxSkills &&
                      !selectedSkills.includes(skill)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={
                      selectedSkills.length >= maxSkills &&
                      !selectedSkills.includes(skill)
                    }
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {!customSkill && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a custom skill"
            value={customSkillInput}
            onChange={(e) => setCustomSkillInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCustomSkillAdd}
            disabled={!customSkillInput.trim()}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 