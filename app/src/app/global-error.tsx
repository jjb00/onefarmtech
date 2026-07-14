"use client";

import * as Sentry from "@sentry/nextjs";
import {useEffect} from "react";

export default function GlobalError({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="en"><body className="grid min-h-screen place-items-center bg-[#f4f8ef] p-6 text-[#102015]"><main className="max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-black">Something went wrong</h1><p className="mt-3 text-[#405348]">The issue has been recorded. Please try again, or contact OneFarmTech support if it continues.</p><button onClick={reset} className="mt-6 rounded-full bg-[#1f7a3f] px-6 py-3 font-black text-white">Try again</button></main></body></html>;
}
