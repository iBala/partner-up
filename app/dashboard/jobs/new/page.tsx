'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { ChevronRight, CircleHelp, X, Plus } from "lucide-react";

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SKILL_CATEGORIES,
  DESCRIPTION_EXAMPLES,
  RESOURCE_LINK_EXAMPLES,
  createProjectSchema,
  type CreateProjectInput,
  type ResourceLink
} from './types';

import ProtectedHeader from "@/components/protected-header";

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [commitment, setCommitment] = useState('< 5 hrs/week');
  const [resourceName, setResourceName] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceLinks, setResourceLinks] = useState<ResourceLink[]>([]);

  // Validation state
  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectInput, string>>>({});
  const [linkError, setLinkError] = useState<string | null>(null);

  const MIN_DESCRIPTION_LENGTH = 50;
  const MAX_SKILLS = 8;
  const isDescriptionValid = description.length >= MIN_DESCRIPTION_LENGTH;
  const canAddSkill = selectedSkills.length < MAX_SKILLS && customSkill.trim() !== '';
  const canAddResource = resourceName.trim() !== '' && resourceUrl.trim() !== '';

  const validateUrl = (url: string): { isValid: boolean; normalizedUrl: string } => {
    try {
      // If URL doesn't start with http:// or https://, add https://
      const normalizedUrl = url.trim().startsWith('http://') || url.trim().startsWith('https://') 
        ? url.trim() 
        : `https://${url.trim()}`
      
      // Create URL object to validate
      const urlObj = new URL(normalizedUrl)
      
      // Check if the hostname has a TLD (e.g., .com, .org, etc.)
      // This regex checks for at least one dot followed by 2 or more characters
      const hasTLD = /\.([a-zA-Z]{2,})$/.test(urlObj.hostname)
      
      if (!hasTLD) {
        return { isValid: false, normalizedUrl }
      }
      
      return { isValid: true, normalizedUrl }
    } catch {
      return { isValid: false, normalizedUrl: url.trim() }
    }
  }

  const handleAddResource = () => {
    if (!canAddResource) return;

    const { isValid, normalizedUrl } = validateUrl(resourceUrl);
    if (!isValid) {
      setLinkError("Please enter a valid URL with a top-level domain (e.g., github.com/your-repo)");
      return;
    }

    setLinkError(null);
    setResourceLinks([...resourceLinks, { name: resourceName, url: normalizedUrl }]);
    setResourceName("");
    setResourceUrl("");
  };

  const handleRemoveResource = (index: number) => {
    setResourceLinks(resourceLinks.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    try {
      createProjectSchema.parse({
        title,
        description,
        skills_needed: selectedSkills,
        custom_skill: customSkill,
        commitment,
        resource_links: resourceLinks
      });
      setErrors({});
      return true;
    } catch (error: any) {
      const formattedErrors: typeof errors = {};
      error.errors.forEach((err: any) => {
        const path = err.path[0] as keyof CreateProjectInput;
        formattedErrors[path] = err.message;
      });
      setErrors(formattedErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[NewJob] Form submission started');

    if (!validateForm()) {
      console.log('[NewJob] Form validation failed');
      toast.error('Please fix the form errors before submitting');
      return;
    }

    if (!user) {
      console.log('[NewJob] No user found');
      toast.error('You must be logged in to create a project');
      return;
    }

    console.log('[NewJob] User authenticated:', {
      userId: user.id,
      email: user.email
    });

    setIsSubmitting(true);

    try {
      // Combine selected skills with custom skill if present
      const allSkills = customSkill 
        ? [...selectedSkills, customSkill]
        : selectedSkills;

      console.log('[NewJob] Preparing request payload:', {
        title,
        descriptionLength: description.length,
        skillsCount: allSkills.length,
        commitment,
        resourceLinksCount: resourceLinks.length
      });

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          skills_needed: allSkills,
          commitment,
          resource_links: resourceLinks,
        }),
      });

      console.log('[NewJob] API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('[NewJob] Response data:', data);

      if (!response.ok) {
        console.error('[NewJob] API error:', {
          status: response.status,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Failed to create project');
      }

      console.log('[NewJob] Project created successfully');
      toast.success('Project created successfully!');
      router.push('/dashboard/jobs');
    } catch (error: any) {
      console.error('[NewJob] Error creating project:', {
        error,
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111]">
      <ProtectedHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard/jobs" className="hover:text-gray-900 dark:hover:text-gray-100">
            Jobs
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 dark:text-gray-100">Create New Project</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your project name"
              className={`h-8 text-sm ${errors.title ? 'border-red-500' : ''}`}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="description" className="text-sm font-medium">
                What are you building?
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex items-center text-gray-500 hover:text-gray-700">
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2">
                      <p className="text-xs font-medium">{DESCRIPTION_EXAMPLES.title}</p>
                      <div>
                        <p className="text-xs font-medium">Examples:</p>
                        <ul className="list-disc pl-4 text-xs">
                          {DESCRIPTION_EXAMPLES.examples.map((example, i) => (
                            <li key={i}>{example}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium">Tips:</p>
                        <ul className="list-disc pl-4 text-xs">
                          {DESCRIPTION_EXAMPLES.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project and what you're looking to build..."
              className={`text-sm resize-none ${errors.description ? 'border-red-500' : ''}`}
              rows={5}
            />
            {!isDescriptionValid && (
              <div className="text-xs text-gray-500">
                <span>{MIN_DESCRIPTION_LENGTH - description.length} more characters needed</span>
              </div>
            )}
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Required Skills (up to {MAX_SKILLS})</label>
            <div className="space-y-3">
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="h-5 text-sm font-normal flex items-center gap-1 py-0"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                        className="ml-1 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500">
                {selectedSkills.length}/{MAX_SKILLS} skills selected
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-8 text-sm">
                    Select skills
                    <ChevronRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {SKILL_CATEGORIES.map((category) => (
                    <DropdownMenuSub key={category.category}>
                      <DropdownMenuSubTrigger className="text-sm">
                        {category.category}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        {category.skills.map((skill) => (
                          <DropdownMenuCheckboxItem
                            key={skill}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => {
                              if (selectedSkills.includes(skill)) {
                                setSelectedSkills(selectedSkills.filter(s => s !== skill));
                              } else if (selectedSkills.length < MAX_SKILLS) {
                                setSelectedSkills([...selectedSkills, skill]);
                              }
                            }}
                            disabled={!selectedSkills.includes(skill) && selectedSkills.length >= MAX_SKILLS}
                            className="text-sm"
                          >
                            {skill}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs text-gray-500" disabled>
                    {selectedSkills.length}/{MAX_SKILLS} skills selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (canAddSkill) {
                      setSelectedSkills([...selectedSkills, customSkill]);
                      setCustomSkill('');
                    }
                  }}
                  disabled={!canAddSkill}
                  className="h-8 w-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {errors.skills_needed && (
              <p className="text-xs text-red-500">{errors.skills_needed}</p>
            )}
          </div>

          {/* Time Commitment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Commitment</label>
            <RadioGroup
              value={commitment}
              onValueChange={setCommitment}
              className="grid grid-cols-2 gap-3"
            >
              {[
                '< 5 hrs/week',
                '5-10 hrs/week',
                '10-20 hrs/week',
                '20-40 hrs/week'
              ].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} className="h-3.5 w-3.5" />
                  <label htmlFor={option} className="text-sm">
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup>
            {errors.commitment && (
              <p className="text-xs text-red-500">{errors.commitment}</p>
            )}
          </div>

          {/* Resource Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resource Links (Optional)</label>
            <div className="space-y-3">
              {resourceLinks.length > 0 && (
                <div className="space-y-2">
                  {resourceLinks.map((resource, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-md px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{resource.name}</span>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 truncate max-w-[250px]"
                        >
                          {resource.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveResource(index)}
                        className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Resource name (e.g., GitHub Repository)"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    className="h-8 text-sm flex-1"
                  />
                  <Input
                    placeholder="URL"
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => {
                      setResourceUrl(e.target.value);
                      setLinkError(null);
                    }}
                    className={`h-8 text-sm flex-[2] ${linkError ? "border-red-500" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddResource}
                    disabled={!canAddResource}
                    className="h-8 w-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {linkError && (
                  <p className="text-xs text-red-500">{linkError}</p>
                )}

                <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                  <div className="font-medium mb-1">Suggested resources:</div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {RESOURCE_LINK_EXAMPLES.examples.map((example, i) => (
                      <li key={i}>{example}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            {errors.resource_links && (
              <p className="text-xs text-red-500">{errors.resource_links}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-8 text-sm bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            disabled={isSubmitting || !isDescriptionValid || selectedSkills.length === 0}
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </Button>
        </form>
      </main>
    </div>
  );
} 