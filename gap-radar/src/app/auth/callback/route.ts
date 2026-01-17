import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { WelcomeEmail } from '@/lib/email-templates'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user exists in our users table, if not create them
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0]

          // Create user record
          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            name: userName,
            avatar_url: user.user_metadata?.avatar_url,
          })

          // Create default project
          await supabase.from('projects').insert({
            owner_id: user.id,
            name: 'My First Project',
          })

          // Send welcome email
          try {
            await sendEmail({
              to: user.email!,
              subject: 'Welcome to GapRadar! 🎉',
              react: WelcomeEmail({
                userName,
                userEmail: user.email!,
              }),
            })
            console.log('✅ Welcome email sent to:', user.email)
          } catch (error) {
            // Don't fail signup if email fails
            console.error('⚠️ Failed to send welcome email:', error)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
