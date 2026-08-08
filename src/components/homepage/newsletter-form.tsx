"use client";

import { useState } from "react";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      className="mt-5 flex max-w-xs items-center overflow-hidden rounded-full bg-white pl-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          toast.error("Enter a valid email address");
          return;
        }
        toast.success("Thanks for subscribing!");
        setEmail("");
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Subscribe to our newsletter"
        className="h-11 min-w-0 flex-1 border-0 bg-transparent text-xs text-black outline-none placeholder:text-[#9CA3AF]"
      />
      <button type="submit" className="h-11 shrink-0 rounded-full bg-black px-5 text-xs font-semibold text-white">
        Subscribe
      </button>
    </form>
  );
}
