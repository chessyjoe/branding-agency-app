"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL parameters
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            setStatus("error")
            setMessage(error.message)
          } else {
            setStatus("success")
            setMessage("Your email has been confirmed successfully!")
            // Redirect to home after 3 seconds
            setTimeout(() => {
              router.push("/")
            }, 3000)
          }
        } else {
          setStatus("error")
          setMessage("Invalid confirmation link.")
        }
      } catch (error) {
        setStatus("error")
        setMessage("An unexpected error occurred.")
      }
    }

    handleEmailConfirmation()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Confirming your email...</h1>
              <p className="text-gray-600">Please wait while we verify your account.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Email Confirmed!</h1>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">You'll be redirected to the homepage in a few seconds.</p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
              <h1 className="text-2xl font-semibold text-gray-900">Confirmation Failed</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>

        <div className="space-y-4">
          {status === "success" && (
            <Link href="/">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Go to Homepage</Button>
            </Link>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full bg-transparent">
                  Try Signing Up Again
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign In Instead</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
