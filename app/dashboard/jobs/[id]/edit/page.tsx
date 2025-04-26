'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { ChevronRight, CircleHelp, X, Plus } from "lucide-react";
import ProtectedHeader from "@/components/protected-header";

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
} from '../../new/types';

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }
        const project = await response.json();
        
        // Populate form fields
        setTitle(project.title);
        setDescription(project.description);
        setSelectedSkills(project.skills_needed);
        setCommitment(project.commitment);
        setResourceLinks(project.resource_links || []);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

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
    console.log('[EditJob] Form submission started');

    if (!validateForm()) {
      console.log('[EditJob] Form validation failed');
      toast.error('Please fix the form errors before submitting');
      return;
    }

    if (!user) {
      console.log('[EditJob] No user found');
      toast.error('You must be logged in to update the project');
      return;
    }

    console.log('[EditJob] User authenticated:', {
      userId: user.id,
      email: user.email
    });

    setIsSubmitting(true);

    try {
      // Combine selected skills with custom skill if present
      const allSkills = customSkill 
        ? [...selectedSkills, customSkill]
        : selectedSkills;

      console.log('[EditJob] Preparing request payload:', {
        title,
        descriptionLength: description.length,
        skillsCount: allSkills.length,
        commitment,
        resourceLinksCount: resourceLinks.length
      });

      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
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

      console.log('[EditJob] API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('[EditJob] Response data:', data);

      if (!response.ok) {
        console.error('[EditJob] API error:', {
          status: response.status,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Failed to update project');
      }

      console.log('[EditJob] Project updated successfully');
      toast.success('Project updated successfully!');
      router.push('/dashboard/jobs');
    } catch (error: any) {
      console.error('[EditJob] Error updating project:', {
        error,
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111]">
        <ProtectedHeader />
        <main className="container max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/dashboard/jobs">Jobs</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Edit Project</span>
          </div>
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#111111]">
      <ProtectedHeader />
      <main className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard/jobs">Jobs</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Edit Project</span>
        </div>
        
        {/* <h1 className="text-2xl font-semibold mb-8">Edit Project</h1> */}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your project name"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">What are you building?</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project and what you're looking to build..."
              className={`min-h-[160px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-sm text-gray-500">
              {description.length < MIN_DESCRIPTION_LENGTH 
                ? `${MIN_DESCRIPTION_LENGTH - description.length} more characters needed`
                : `${description.length} / 2000 characters`}
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Required Skills (up to 8)</label>
              <span className="text-sm text-gray-500">{selectedSkills.length}/8 skills selected</span>
            </div>

            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSelectedSkills(selectedSkills.filter((_, i) => i !== index))}
                      className="ml-1 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    disabled={selectedSkills.length >= MAX_SKILLS}
                  >
                    Select skills
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {SKILL_CATEGORIES.map((category) => (
                    <DropdownMenuSub key={category.category}>
                      <DropdownMenuSubTrigger>{category.category}</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {category.skills.map((skill: string) => (
                          <DropdownMenuCheckboxItem
                            key={skill}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={(checked) => {
                              if (checked && selectedSkills.length < MAX_SKILLS) {
                                setSelectedSkills([...selectedSkills, skill]);
                              } else if (!checked) {
                                setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                              }
                            }}
                          >
                            {skill}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-2">
              <Input
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add a custom skill"
                disabled={selectedSkills.length >= MAX_SKILLS}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => {
                  if (canAddSkill) {
                    setSelectedSkills([...selectedSkills, customSkill.trim()]);
                    setCustomSkill('');
                  }
                }}
                disabled={!canAddSkill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time Commitment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Commitment</label>
            <RadioGroup
              value={commitment}
              onValueChange={setCommitment}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="< 5 hrs/week" id="r1" />
                <label htmlFor="r1">{"< 5 hrs/week"}</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5-10 hrs/week" id="r2" />
                <label htmlFor="r2">5-10 hrs/week</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10-20 hrs/week" id="r3" />
                <label htmlFor="r3">10-20 hrs/week</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="20-40 hrs/week" id="r4" />
                <label htmlFor="r4">20-40 hrs/week</label>
              </div>
            </RadioGroup>
          </div>

          {/* Resource Links */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resource Links (Optional)</label>
            <div className="flex gap-2">
              <Input
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="Resource name (e.g., GitHub Repo)"
                className="flex-1"
              />
              <Input
                value={resourceUrl}
                onChange={(e) => {
                  setResourceUrl(e.target.value);
                  setLinkError(null);
                }}
                placeholder="URL"
                className={`flex-1 ${linkError ? 'border-red-500' : ''}`}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAddResource}
                disabled={!canAddResource}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {linkError && (
              <p className="text-sm text-red-500">{linkError}</p>
            )}

            {resourceLinks.length > 0 && (
              <div className="space-y-2">
                {resourceLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={link.name} readOnly className="flex-1" />
                    <Input value={link.url} readOnly className="flex-1" />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveResource(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <p className="font-medium mb-2">Suggested resources:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>GitHub Repository</li>
                <li>Project Documentation</li>
                <li>Design Mockups</li>
                <li>Technical Specification</li>
              </ul>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
              disabled={isSubmitting || !isDescriptionValid || selectedSkills.length === 0}
            >
              {isSubmitting ? 'Updating...' : 'Update Project'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
} 