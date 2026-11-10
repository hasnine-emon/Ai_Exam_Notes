import React, { useState, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const authPost = (path, body) =>
  axios.post(serverUrl + "/api/auth" + path, body, { withCredentials: true });

function Auth() {
  const dispatch = useDispatch();

  // mode: "login" | "register" | "forgot"   step (forgot e): 1 email, 2 otp, 3 new password
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cooldown, setCooldown] = useState(0);
  // false thakle shudhu "Get Started" button dekhabe, click korle form khulbe
  const [showForm, setShowForm] = useState(false);

  // OTP resend timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const switchMode = (m) => {
    setMode(m);
    setStep(1);
    setError("");
    setInfo("");
    setShowPass(false);
    setForm((f) => ({
      ...f,
      password: "",
      confirmPassword: "",
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    }));
  };

  const getError = (err, fallback = "Something went wrong. Please try again.") =>
    err?.response?.data?.message || fallback;

  // ---------------- GOOGLE ----------------
  const handleGoogleauth = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const response = await signInWithPopup(auth, provider);
      const idToken = await response.user.getIdToken();
      const result = await authPost("/google", { idToken });
      dispatch(setUserData(result.data));
    } catch (err) {
      if (err?.response?.data?.code === "NOT_REGISTERED") {
        // register na thakle age register korte bolbo
        setForm((f) => ({
          ...f,
          name: err.response.data.name || "",
          email: err.response.data.email || "",
        }));
        switchMode("register");
        setInfo(
          "You are not registered yet. Please register first with your name, email and password."
        );
      } else if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        // user nije popup bondho korechhe, kichu dekhanor dorkar nei
      } else {
        console.log("Google error:", err?.code, err?.message);
        setError(getError(err, "Google sign-in failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!form.name.trim()) return setError("Please enter your name");
    if (!emailRegex.test(form.email.trim())) return setError("Enter a valid email");
    if (form.password.length < MIN_PASSWORD)
      return setError(`Password must be at least ${MIN_PASSWORD} characters`);
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    setLoading(true);
    try {
      const result = await authPost("/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      dispatch(setUserData(result.data));
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!emailRegex.test(form.email.trim())) return setError("Enter a valid email");
    if (!form.password) return setError("Please enter your password");

    setLoading(true);
    try {
      const result = await authPost("/login", {
        email: form.email.trim(),
        password: form.password,
      });
      dispatch(setUserData(result.data));
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FORGOT PASSWORD ----------------
  const sendOtp = async (e) => {
    e?.preventDefault();
    setError("");
    setInfo("");
    if (!emailRegex.test(form.email.trim())) return setError("Enter a valid email");

    setLoading(true);
    try {
      const result = await authPost("/forgot-password", {
        email: form.email.trim(),
      });
      setStep(2);
      setCooldown(60);
      setInfo(result.data.message);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!/^\d{6}$/.test(form.otp)) return setError("Enter the 6 digit OTP");

    setLoading(true);
    try {
      await authPost("/verify-otp", {
        email: form.email.trim(),
        otp: form.otp,
      });
      setStep(3);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (form.newPassword.length < MIN_PASSWORD)
      return setError(`Password must be at least ${MIN_PASSWORD} characters`);
    if (form.newPassword !== form.confirmNewPassword)
      return setError("Passwords do not match");

    setLoading(true);
    try {
      const result = await authPost("/reset-password", {
        email: form.email.trim(),
        otp: form.otp,
        newPassword: form.newPassword,
      });
      switchMode("login");
      setInfo(result.data.message);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: "Welcome back",
    register: "Create your account",
    forgot:
      step === 1 ? "Forgot password" : step === 2 ? "Enter OTP" : "Set new password",
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white text-black px-8">
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="max-w-7xl mx-auto mt-8
        rounded-2xl
        bg-black/80 backdrop-blur-xl
        border border-white/10
        px-8 py-6
        shadow-[0_20px_45px_rgba(0,0,0,0.6)]"
      >
        <h1
          className="text-2xl font-bold
        bg-linear-to-r from-white via-gray-300 to-white
        bg-clip-text text-transparent"
        >
          ExamNotes AI
        </h1>
        <p className="text-sm text-gray-300 mt-1">
          AI-powered exam-oriented notes & revision
        </p>
      </motion.header>

      <main
        className="max-w-7xl mx-auto py-10 grid grid-cols-1 lg:grid-cols-2 gap-20
      items-center"
      >
        {/* LEFT CONTENT*/}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1
            className="text-5xl lg:text-6xl font-extrabold leading-tight
  bg-gradient-to-br from-black/90 via-black/60 to-black/90
  bg-clip-text text-transparent"
          >
            Unlock Smart <br /> AI Notes
          </h1>

          <p
            className="mt-6 max-w-xl text-lg
  bg-gradient-to-br from-gray-700 via-gray-500/80 to-gray-700
  bg-clip-text text-transparent"
          >
            You get <span className="font-semibold">50 FREE credits</span> to
            create exam notes, project notes, charts, graphs and download clean
            PDFs - instantly using AI.
          </p>

          {/* GET STARTED BUTTON (form hide thake, click korle khulbe) */}
          {!showForm ? (
            <motion.button
              type="button"
              onClick={() => setShowForm(true)}
              whileHover={{ y: -8, scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="mt-10 px-10 py-3 rounded-xl
              bg-gradient-to-br from-black/90 via-black/80 to-black/90
              border border-white/10
              text-white font-semibold text-lg
              shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
            >
              Get Started
            </motion.button>
          ) : (
          /* AUTH CARD */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 max-w-md rounded-2xl p-6 sm:p-8
            bg-gradient-to-br from-black/90 via-black/80 to-black/90
            border border-white/10 text-white
            shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
          >
            <h2 className="text-2xl font-bold">{titles[mode]}</h2>
            {mode === "forgot" && (
              <p className="text-sm text-gray-400 mt-1">
                {step === 1 && "Enter your email and we will send a 6 digit OTP."}
                {step === 2 && `OTP sent to ${form.email}. It is valid for 5 minutes.`}
                {step === 3 && "Choose a new password for your account."}
              </p>
            )}

            {info && (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {info}
              </div>
            )}
            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* ---------- LOGIN ---------- */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="mt-5 space-y-4" noValidate>
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Field
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={setField("password")}
                  placeholder="Your password"
                  autoComplete="current-password"
                  show={showPass}
                  onToggle={() => setShowPass((s) => !s)}
                />
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-sm text-gray-300 hover:text-white underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <SubmitButton loading={loading}>Login</SubmitButton>
              </form>
            )}

            {/* ---------- REGISTER ---------- */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="mt-5 space-y-4" noValidate>
                <Field
                  label="Name"
                  type="text"
                  value={form.name}
                  onChange={setField("name")}
                  placeholder="Your full name"
                  autoComplete="name"
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Field
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={setField("password")}
                  placeholder={`At least ${MIN_PASSWORD} characters`}
                  autoComplete="new-password"
                  show={showPass}
                  onToggle={() => setShowPass((s) => !s)}
                />
                <Field
                  label="Confirm password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={setField("confirmPassword")}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  show={showPass}
                  onToggle={() => setShowPass((s) => !s)}
                />
                <SubmitButton loading={loading}>Register</SubmitButton>
              </form>
            )}

            {/* ---------- FORGOT PASSWORD ---------- */}
            {mode === "forgot" && step === 1 && (
              <form onSubmit={sendOtp} className="mt-5 space-y-4" noValidate>
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={setField("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <SubmitButton loading={loading}>Send OTP</SubmitButton>
              </form>
            )}

            {mode === "forgot" && step === 2 && (
              <form onSubmit={verifyOtp} className="mt-5 space-y-4" noValidate>
                <Field
                  label="6 digit OTP"
                  type="text"
                  value={form.otp}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      otp: e.target.value.replace(/\D/g, "").slice(0, 6),
                    }))
                  }
                  placeholder="______"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  otp
                />
                <SubmitButton loading={loading}>Verify OTP</SubmitButton>
                <div className="text-center text-sm text-gray-400">
                  {cooldown > 0 ? (
                    <span>Resend OTP in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-gray-200 hover:text-white underline-offset-2 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {mode === "forgot" && step === 3 && (
              <form onSubmit={resetPassword} className="mt-5 space-y-4" noValidate>
                <Field
                  label="New password"
                  type="password"
                  value={form.newPassword}
                  onChange={setField("newPassword")}
                  placeholder={`At least ${MIN_PASSWORD} characters`}
                  autoComplete="new-password"
                  show={showPass}
                  onToggle={() => setShowPass((s) => !s)}
                />
                <Field
                  label="Confirm new password"
                  type="password"
                  value={form.confirmNewPassword}
                  onChange={setField("confirmNewPassword")}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  show={showPass}
                  onToggle={() => setShowPass((s) => !s)}
                />
                <SubmitButton loading={loading}>Update password</SubmitButton>
              </form>
            )}

            {/* ---------- GOOGLE (login / register e dekhabe) ---------- */}
            {mode !== "forgot" && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-gray-500">
                  <div className="h-px flex-1 bg-white/10" />
                  OR
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <motion.button
                  type="button"
                  onClick={handleGoogleauth}
                  disabled={loading}
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="w-full px-6 py-3 rounded-xl
                  flex items-center justify-center gap-3
                  bg-white/10 hover:bg-white/15
                  border border-white/10
                  text-white font-semibold
                  disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FcGoogle size={22} />
                  Continue with Google
                </motion.button>
              </>
            )}

            {/* ---------- SWITCH LINKS ---------- */}
            <div className="mt-6 text-center text-sm text-gray-400">
              {mode === "login" && (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-semibold text-white hover:underline"
                  >
                    Register
                  </button>
                </>
              )}
              {mode === "register" && (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-white hover:underline"
                  >
                    Login
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-white hover:underline"
                >
                  Back to login
                </button>
              )}
            </div>
          </motion.div>
          )}

          <p className="mt-4 text-sm text-gray-500">
            {" "}
            Start with 50 free credits Upgrade anytime for more credits Instant
            access
          </p>
        </motion.div>
        {/* RIGHT CONTENT*/}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Feature
            icon="🎁"
            title="50 free credits"
            des="Start with 50 credits to generate
  notes without paying."
          />
          <Feature
            icon="📑"
            title="Exam Notes"
            des="High-yield, revision-ready
  exam-oriented notes."
          />
          <Feature
            icon="🗃️"
            title="Project Notes"
            des="Well-structured documentation for
   assignment & projects."
          />
          <Feature
            icon="📊"
            title="Charts & Graphs"
            des="Auto-generated diagrams, charts and
   flow graphs."
          />
          <Feature
            icon="⬇️"
            title="Free PDF Download"
            des="Download clean, printable PDFs
   instantly."
          />
        </div>
      </main>
    </div>
  );
}

// ---------- chhoto helper component (Auth er bhitore use hoy) ----------
function Field({ label, type, show, onToggle, otp, ...rest }) {
  const isPassword = type === "password";
  return (
    <label className="block">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="relative mt-1">
        <input
          type={isPassword && show ? "text" : type}
          className={`w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white
          placeholder-gray-500 outline-none focus:border-white/40 focus:bg-white/15
          ${isPassword ? "pr-11" : ""}
          ${otp ? "text-center text-2xl tracking-[0.5em] font-semibold" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
    </label>
  );
}

function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-white text-black py-3 font-semibold
      hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

function Feature({ icon, title, des }) {
  return (
    <motion.div
      whileHover={{ y: -12, rotateX: 8, rotateY: -8, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="relative rounded-2xl p-6
    bg-gradient-to-br from-black/90 via-black/80 to-black/90
    backdrop-blur-2xl
    border border-white/10
    shadow-[0_30px_80px_rgba(0,0,0,0.7)]
    text-white"
      style={{ transformStyle: "preserver-3d" }}
    >
      <div
        className=" absolute inset-0 rounded-2xl
      bg-gradient-to-br from-white/10 to-transparent
      opacity-0 hover:opacity-100 transition-opacity
      pointer-events-none"
      />
      <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
        <div className="text-4xl mb-3">{icon} </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className=" text-gray-300 text-sm leading-relaxed">{des}</p>
      </div>
    </motion.div>
  );
}

export default Auth;
