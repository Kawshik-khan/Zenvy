"use client";

import { useState } from "react";
import { createGroup } from "@/app/actions/group";
import { useRouter } from "next/navigation";

export default function CreateGroupModal({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleAction = async (formData: FormData) => {
    setPending(true);
    await createGroup(formData);
    setPending(false);
    setIsOpen(false);
    router.refresh(); // Refresh page to see new group
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={`${className} cursor-pointer`}>
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Create Study Group</h2>
            <form action={handleAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Group Name</label>
                <input required name="name" type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Advanced Calculus Study" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject</label>
                <input required name="subject" type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea name="description" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none" placeholder="What are the goals of this group?"></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2.5 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button disabled={pending} type="submit" className="px-6 py-2.5 rounded-full font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50">
                  {pending ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
