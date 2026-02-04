"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Badge, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import { dictionary as frDictionary } from "@zxcvbn-ts/language-fr";

zxcvbnOptions.setOptions({
  graphs: adjacencyGraphs,
  dictionary: {
    ...commonDictionary,
    ...frDictionary,
  },
});

function strengthLabel(score: number) {
  return ["tres faible", "faible", "moyenne", "bonne", "tres bonne"][score] ?? "-";
}
function strengthPercent(score: number) {
  return Math.round((Math.min(Math.max(score, 0), 4) / 4) * 100);
}
function StrengthBar({ value }: { value: number }) {
  return (
    <div className="mt-2">
      <div className="h-2 w-full rounded-full bg-vdm-gold-200 overflow-hidden">
        <div
          className="h-2 rounded-full bg-vdm-gold-700 transition-all"
          style={{ width: `${strengthPercent(value)}%` }}
        />
      </div>
    </div>
  );
}

function norm(v: string) {
  return (v ?? "").trim();
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) => /^[^\s@]+@[^^\s@]+\.[^\s@]+$/.test(value);

  const pw = useMemo(() => {
    const emailTrim = norm(email).toLowerCase();
    const matriculeTrim = norm(matricule);
    const firstNameTrim = norm(firstName);
    const lastNameTrim = norm(lastName);

    const userInputs = [emailTrim, matriculeTrim, firstNameTrim, lastNameTrim].filter(Boolean);
    return zxcvbn(password, userInputs);
  }, [password, email, matricule, firstName, lastName]);

  const handleSubmit = async () => {
    const firstNameTrim = norm(firstName);
    const lastNameTrim = norm(lastName);
    const emailTrim = norm(email).toLowerCase();
    const matriculeTrim = norm(matricule);

    if (!firstNameTrim || !lastNameTrim || !emailTrim || !matriculeTrim || !password) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!validateEmail(emailTrim)) {
      toast.error("Veuillez entrer une adresse email valide.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    if (pw.score < 2) {
      toast.error("Mot de passe trop faible. Renforcez-le avant de continuer.");
      return;
    }

    setIsLoading(true);
    const t = toast.loading("Creation du compte...");

    try {
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstNameTrim,
          lastName: lastNameTrim,
          email: emailTrim,
          matricule: matriculeTrim,
          password,
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        toast.error(regData?.error ?? "Erreur lors de la création du compte.", { id: t });
        return;
      }

      toast.success("Compte créé. En attente de validation par l'admin.", { id: t });

      setFirstName("");
      setLastName("");
      setEmail("");
      setMatricule("");
      setPassword("");
      setConfirmPassword("");

      window.location.href = "/login?pending=1";
    } catch {
      toast.error("Erreur réseau. Vérifiez votre connexion.", { id: t });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) handleSubmit();
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden bg-gradient-to-br from-vdm-gold-600 via-vdm-gold-500 to-vdm-gold-200 p-12 flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <div className="mb-8 h-28 w-28 flex items-center justify-center overflow-hidden mx-auto">
            <img src="/logo.jpeg" alt="Logo" className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Creer un compte</h1>
          <p className="text-xl opacity-90 leading-relaxed">
            Inscrivez-vous pour acceder a votre espace et gerer vos informations.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-lg">Creation rapide</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-lg">Donnees securisees</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-2">
              <div className="lg:hidden mx-auto mb-4 h-16 w-16 flex items-center justify-center overflow-hidden">
                <img src="/logo.jpeg" alt="Logo" className="h-14 w-14 object-contain" />
              </div>
              <h2 className="text-3xl font-bold text-vdm-gold-800 mb-2">Inscription</h2>
              <p className="text-gray-600">Creez votre compte pour continuer</p>
            </div>

            <div className="space-y-2">
              {/* First name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Prenom(s)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Ex: Alice"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 focus:border-transparent transition"
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                </div>
              </div>

              {/* Last name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Ex: Dupont"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 focus:border-transparent transition"
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              {/* Matricule */}
              <div>
                <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-2">
                  Matricule
                </label>
                <div className="relative">
                  <Badge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="matricule"
                    type="text"
                    placeholder="Ex: EMP001"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 focus:border-transparent transition"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="exemple@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyPress}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 focus:border-transparent transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyPress}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 focus:border-transparent transition"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vdm-gold-600 hover:text-vdm-gold-700 transition"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <StrengthBar value={pw.score} />
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold">{strengthLabel(pw.score)}</span>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyPress}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 focus:border-transparent transition"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vdm-gold-600 hover:text-vdm-gold-700 transition"
                    aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    disabled={isLoading}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-vdm-gold-500 to-vdm-gold-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 mt-4"
              >
                {isLoading ? "Creation..." : "Creer mon compte"}
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Deja un compte -{" "}
              <a
                href="/login"
                className="text-vdm-gold-600 font-semibold hover:text-vdm-gold-700 hover:underline"
              >
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
