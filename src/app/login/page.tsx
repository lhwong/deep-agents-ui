import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <h1>Welcome to Deep Agents</h1>
      
      <form action={async () => {
        "use server"
        await signIn("google")
      }}>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Sign in with Google
        </button>
      </form>

      {/* Other providers... */}
      <form action={async () => {
        "use server"
        await signIn("github")
      }}>
        <button type="submit" className="px-4 py-2 bg-gray-800 text-white rounded">
          Sign in with GitHub
        </button>
      </form>

      <form action={async (formData) => {
        "use server"
        await signIn("credentials", formData)
      }} className="flex flex-col gap-2 items-center">
        <input type="text" name="username" placeholder="Username" className="px-4 py-2 border rounded" />
        <input type="password" name="password" placeholder="Password" className="px-4 py-2 border rounded" />
        <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded">
          Sign in with Credentials
        </button>
      </form>
    </div>
  )
}
