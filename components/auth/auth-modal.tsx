'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import LoginForm from '@/components/auth/login-form'
import SignupForm from '@/components/auth/signup-form'

export default function AuthModal() {
  const { showAuthModal, closeAuthModal, authMode } = useAuth()

  return (
    <Dialog open={showAuthModal} onOpenChange={closeAuthModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            {authMode === 'login' ? 'Welcome back' : 'Create an account'}
          </DialogTitle>
        </DialogHeader>
        {authMode === 'login' ? <LoginForm /> : <SignupForm />}
      </DialogContent>
    </Dialog>
  )
} 