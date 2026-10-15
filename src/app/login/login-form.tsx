"use client";

import { useActionState, useState } from "react";

import { login, type LoginState } from "@/app/actions/auth.actions";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="form">
      <input type="hidden" name="next" value={next} />

      <div className="field">
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          className="input"
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="input-wrap">
          <input
            className="input"
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="input-affix"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {state?.error ? (
        <p className="error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
