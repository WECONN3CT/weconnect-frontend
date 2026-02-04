import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { Input, PasswordInput } from "../../components/ui/Input";
import { LoadingSpinner } from "../../components/ui/Loading";
import { isValidEmail } from "../../lib/utils";

type AuthMode = "login" | "signup";

type AuthPageProps = {
  initialMode?: AuthMode;
};

const AuthPage = ({ initialMode = "login" }: AuthPageProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state
  const { login, signup, isLoading } = useAuthStore();
  const { success } = useToastStore();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname === "/signup") {
      setMode("signup");
      return;
    }
    if (location.pathname === "/login") {
      setMode("login");
      return;
    }
    setMode(initialMode);
  }, [initialMode, location.pathname]);

  const handleToggle = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrors({});
    setFormError(null);
    navigate(nextMode === "login" ? "/login" : "/signup");
  };

  const clearFormError = () => setFormError(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (mode === "signup") {
      if (!firstName) newErrors.firstName = "First name is required";
      if (!lastName) newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) return;

    try {
      if (mode === "login") {
        await login({ email, password });
        success("Willkommen zurück!");
        navigate("/dashboard");
      } else {
        await signup({ email, password, firstName, lastName });
        success("Account erfolgreich erstellt!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      // Professionelle Fehlermeldungen
      const errorMessage = err.response?.data?.message || err.message;

      if (mode === "login") {
        if (errorMessage?.includes("Passwort") || errorMessage?.includes("password") || errorMessage?.includes("E-Mail") || errorMessage?.includes("email") || err.response?.status === 401) {
          setFormError("E-Mail oder Passwort ist falsch. Bitte überprüfe deine Eingaben.");
        } else if (err.response?.status === 429) {
          setFormError("Zu viele Anmeldeversuche. Bitte warte einen Moment und versuche es erneut.");
        } else {
          setFormError("Anmeldung fehlgeschlagen. Bitte versuche es später erneut.");
        }
      } else {
        if (errorMessage?.includes("existiert") || errorMessage?.includes("exists") || err.response?.status === 409) {
          setFormError("Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an oder verwende eine andere E-Mail.");
        } else if (errorMessage?.includes("Passwort") || errorMessage?.includes("password")) {
          setFormError("Das Passwort erfüllt nicht die Sicherheitsanforderungen. Mindestens 8 Zeichen mit Groß-/Kleinbuchstaben, Zahl und Sonderzeichen.");
        } else {
          setFormError("Registrierung fehlgeschlagen. Bitte überprüfe deine Eingaben und versuche es erneut.");
        }
      }
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="relative min-h-screen bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl bg-white/95 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.8)] ring-1 ring-white/60 backdrop-blur">
          <div
            className={`flex w-[200%] transition-transform duration-500 ease-in-out ${
              isLogin ? "translate-x-0" : "-translate-x-1/2"
            }`}
          >
            {/* Login Form */}
            <div className="w-1/2 p-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">WeConnect</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Log in to continue managing your automations.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                {/* Error Alert */}
                {formError && (
                  <div className="relative flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{formError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFormError}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  disabled={isLoading}
                />

                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                New here?{" "}
                <button
                  type="button"
                  className="font-semibold text-sky-600 hover:text-sky-500"
                  onClick={() => handleToggle("signup")}
                  disabled={isLoading}
                >
                  Create an account
                </button>
              </div>
            </div>

            {/* Signup Form */}
            <div className="w-1/2 p-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">WeConnect</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">Create your account</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Start your free trial in just a few steps.
                </p>
              </div>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                {/* Error Alert */}
                {formError && (
                  <div className="relative flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 animate-shake">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">{formError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFormError}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First name"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    error={errors.firstName}
                    disabled={isLoading}
                  />
                  <Input
                    label="Last name"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    error={errors.lastName}
                    disabled={isLoading}
                  />
                </div>

                <Input
                  label="Work email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  disabled={isLoading}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  helperText="Must be at least 8 characters"
                  disabled={isLoading}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating account...
                    </>
                  ) : (
                    "Sign up"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-sky-600 hover:text-sky-500"
                  onClick={() => handleToggle("login")}
                  disabled={isLoading}
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AuthPage };
export const LoginPage = () => <AuthPage initialMode="login" />;
export default LoginPage;
