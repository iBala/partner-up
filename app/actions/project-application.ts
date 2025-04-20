"use server"

import { z } from "zod"

// Define validation schema
const applicationSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  profileLinks: z.string().optional(),
  contribution: z.string().min(20, { message: "Please provide at least 20 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phoneNumber: z.string().optional(),
  projectId: z.number(),
})

export type ApplicationFormState = {
  errors?: {
    fullName?: string[]
    profileLinks?: string[]
    contribution?: string[]
    email?: string[]
    phoneNumber?: string[]
    _form?: string[]
  }
  message?: string
  success?: boolean
}

export async function submitProjectApplication(
  prevState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const projectId = Number.parseInt(formData.get("projectId") as string)

    const validatedFields = applicationSchema.safeParse({
      fullName: formData.get("fullName"),
      profileLinks: formData.get("profileLinks"),
      contribution: formData.get("contribution"),
      email: formData.get("email"),
      phoneNumber: formData.get("phoneNumber"),
      projectId,
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Please correct the errors in the form.",
        success: false,
      }
    }

    // In a real app, you would save this data to a database
    console.log("Application submitted:", validatedFields.data)

    // Return success state
    return {
      message: "Your application has been submitted successfully!",
      success: true,
    }
  } catch (error) {
    return {
      message: "An unexpected error occurred. Please try again.",
      success: false,
    }
  }
}
