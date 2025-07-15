import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import logo from "../../assets/logo.png"; // Corrected path to the company logo
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const demoUsers = [
  { email: "admin@example.com", role: "Admin", description: "Full access to all sections" },
  { email: "quality@example.com", role: "Quality", description: "Access to Menu Principal + Quality section" },
  { email: "logistics@example.com", role: "Logistics", description: "Access to Menu Principal + Logistics section" },
  { email: "reception@example.com", role: "Reception", description: "Access to Menu Principal + Reception section" },
  { email: "production@example.com", role: "Production", description: "Access to Menu Principal + Production section" },
  { email: "personnel@example.com", role: "Personnel", description: "Access to Menu Principal + Personnel section" },
  { email: "comptabilite@example.com", role: "Comptabilité", description: "Access to Menu Principal + Comptabilité section" },
  { email: "maintenance@example.com", role: "Maintenance", description: "Access to Menu Principal + Maintenance section" },
];

const fetchUserRole = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (userDoc.exists()) {
    return userDoc.data().role; // e.g., "admin", "operator", etc.
  }
  return null;
};

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      setLocation("/");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleDemoUserSelect = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full space-y-8 p-8 bg-white rounded-lg shadow-lg"
      >
        <div className="text-center">
          <img src={logo} alt="Company Logo" className="mx-auto h-16 w-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">Welcome back! Please enter your details.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </motion.button>
          </div>
        </form>

        {/* Demo Users Section */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Users (Password: password)</h3>
          <div className="space-y-2">
            {demoUsers.map((user, index) => (
              <button
                key={index}
                onClick={() => handleDemoUserSelect(user.email)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{user.role}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {user.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}