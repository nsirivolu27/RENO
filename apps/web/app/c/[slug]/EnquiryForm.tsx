"use client";

import { useState } from "react";
import type { FormEvent } from "react";

interface EnquiryFormProps {
  companyId: string;
  companyName: string;
  offerings: Array<{ id: string; title: string }>;
}

/**
 * Lead capture on a company's public showcase. Deliberately short: name plus
 * one way to reach them. Every extra field costs conversions.
 */
export default function EnquiryForm({
  companyId,
  companyName,
  offerings,
}: EnquiryFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || (!email.trim() && !phone.trim())) {
      setError("Please add your name and either an email or phone number.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch(`/api/companies/${companyId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          message: message || undefined,
          offeringId: offeringId || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send your enquiry. Please try again.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("Network error. Please try again.");
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="alert alert-ok" role="status">
        Thanks. Your enquiry is with {companyName}. They&apos;ll be in touch
        using the details you provided.
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <div className="enquiry-row">
        <div className="field">
          <label htmlFor="lead-name">Your name</label>
          <input
            id="lead-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="lead-email">Email</label>
          <input
            id="lead-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="lead-phone">Phone</label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
      </div>

      {offerings.length > 0 && (
        <div className="field">
          <label htmlFor="lead-offering">Interested in</label>
          <select
            id="lead-offering"
            value={offeringId}
            onChange={(e) => setOfferingId(e.target.value)}
          >
            <option value="">Not sure yet / something else</option>
            {offerings.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field">
        <label htmlFor="lead-message">About your space (optional)</label>
        <textarea
          id="lead-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. 1990s kitchen, roughly 180 sq ft, hoping to start in spring."
        />
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={state === "sending"}
      >
        {state === "sending" ? "Sending..." : "Send enquiry"}
      </button>
    </form>
  );
}
