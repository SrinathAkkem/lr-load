"use client";

import { useState } from "react";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      className="mt-5 flex w-full min-w-0 max-w-sm flex-col gap-2 rounded-2xl bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:rounded-full sm:pl-4 sm:pr-0"
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
        className="h-10 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-3 text-sm text-[#333333] outline-none placeholder:text-[#9CA3AF] sm:h-11 sm:rounded-none sm:px-0"
      />
      <button
        type="submit"
        className="h-10 w-full shrink-0 rounded-full bg-black px-4 text-sm font-semibold text-white sm:h-11 sm:w-auto sm:px-6"
      >
        Subscribe
      </button>
    </form>
  );
}
