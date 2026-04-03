"use client";

import { useState } from "react";
import { createChannel } from "@/app/actions/channel";
import { useRouter } from "next/navigation";

export default function CreateChannelModal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const generateTag = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (val: string) => {
    setNameValue(val);
    setTagValue(generateTag(val));
  };

  const handleAction = async (formData: FormData) => {
    setPending(true);
    setError("");
    try {
      await createChannel(formData);
      setPending(false);
      setIsOpen(false);
      setNameValue("");
      setTagValue("");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setPending(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={`${className} cursor-pointer`}>
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xl">tag</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create Channel</h2>
                  <p className="text-xs text-slate-500">Public channel anyone can discover & join</p>
                </div>
              </div>
            </div>

            <form action={handleAction} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Channel Name
                </label>
                <input
                  required
                  name="name"
                  type="text"
                  value={nameValue}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                  placeholder="e.g. CS 101 Study Hall"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Unique Tag
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">#</span>
                  <input
                    required
                    name="tag"
                    type="text"
                    value={tagValue}
                    onChange={(e) => setTagValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                    placeholder="cs-101-study-hall"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Others will find your channel by searching this tag
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 h-20 resize-none text-sm transition-all"
                  placeholder="What's this channel about?"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setError(""); }}
                  className="px-6 py-2.5 rounded-full font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={pending}
                  type="submit"
                  className="px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all shadow-md disabled:opacity-50 text-sm"
                >
                  {pending ? "Creating..." : "Create Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
