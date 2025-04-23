import { z } from "zod";

export const resourceLinkSchema = z.object({
  name: z.string()
    .min(1, "Resource name is required")
    .max(50, "Name too long"),
  url: z.string()
    .url("Please enter a valid URL")
});

export const createProjectSchema = z.object({
  title: z.string()
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name cannot exceed 100 characters"),
  
  description: z.string()
    .min(50, "Description should be at least 50 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  
  skills_needed: z.array(z.string())
    .min(1, "Select at least one skill")
    .max(8, "Cannot select more than 8 skills"),
  
  custom_skill: z.string().optional(),
  
  commitment: z.enum([
    '< 5 hrs/week',
    '5-10 hrs/week',
    '10-20 hrs/week',
    '20-40 hrs/week'
  ]),
  
  resource_links: z.array(resourceLinkSchema)
    .optional()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export interface ResourceLink {
  name: string;
  url: string;
}

export const SKILL_CATEGORIES = [
  {
    category: "AI App Engineering",
    skills: [
      "LLM App Dev (LangChain/LangGraph)",
      "Chatbot Dev",
      "RAG Implementation",
      "AI Agents & Workflows",
      "Voice/Multimodal Apps",
      "AI Plugin Dev (OpenAI/Anthropic)",
      "Vector DB Integration (Pinecone/Weaviate/PGVector)"
    ]
  },
  {
    category: "Model Building & Tuning",
    skills: [
      "Fine-Tuning (LoRA/QLoRA)",
      "Instruction Tuning",
      "Prompt Engineering",
      "Parameter-Efficient Tuning",
      "Synthetic Data Generation",
      "Model Evaluation & Benchmarking"
    ]
  },
  {
    category: "Data Ops",
    skills: [
      "Data Collection & Scraping",
      "Data Labeling",
      "Feature Engineering",
      "ETL/ELT Pipelines",
      "Dataset Curation (HuggingFace)"
    ]
  },
  {
    category: "MLOps & Deployment",
    skills: [
      "FastAPI/Litestar Serving",
      "Serverless AI (Vercel/Cloudflare)",
      "GPU Infra (RunPod/AWS SageMaker)",
      "CI/CD for Models",
      "Monitoring & Drift Detection"
    ]
  },
  {
    category: "AI-Centric Product & Design",
    skills: [
      "AI Product Management",
      "Conversational UX Design",
      "Prompt-UX Copywriting",
      "AI Persona Writing",
      "AI Safety & Ethics Review"
    ]
  },
  {
    category: "Growth & Distribution",
    skills: [
      "AI-Generated Content",
      "Growth Hacking with GenAI",
      "SEO with AI Tools",
      "Community Building (Discord/Slack bots)"
    ]
  },
  {
    category: "Business & Compliance",
    skills: [
      "AI Legal & Policy Scan",
      "Pricing Models for AI SaaS",
      "Usage Analytics (Telemetry)",
      "API Metering & Billing"
    ]
  }
] as const;

export const DESCRIPTION_EXAMPLES = {
  title: "How to write a great project description:",
  examples: [
    "Building a RAG-based chatbot for medical research papers. Need help with vector DB integration and prompt engineering.",
    "Creating an AI-powered content calendar tool. Looking for someone with experience in LangChain and content generation.",
  ],
  tips: [
    "Be specific about the project goals",
    "Mention key technologies or frameworks",
    "Highlight unique challenges or requirements",
    "Include project stage (starting/in-progress)"
  ]
} as const;

export const RESOURCE_LINK_EXAMPLES = {
  title: "Helpful resources to add:",
  examples: [
    "GitHub Repository",
    "Project Documentation",
    "Design Mockups",
    "Technical Specification"
  ]
} as const; 