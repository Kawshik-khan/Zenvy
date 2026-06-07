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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="glass-panel w-full max-w-md rounded-[28px] p-6 animate-scale-in">
            <h2 className="text-2xl font-bold mb-4 text-on-surface">Create Study Group</h2>
            <form action={handleAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Group Name</label>
                <input required name="name" type="text" className="app-input px-4 py-3" placeholder="e.g. Advanced Calculus Study" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Subject</label>
                <input required name="subject" type="text" className="app-input px-4 py-3" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">Description</label>
                <textarea name="description" className="app-input px-4 py-3 h-24 resize-none" placeholder="What are the goals of this group?"></textarea>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-2.5 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
                <button disabled={pending} type="submit" className="px-6 py-2.5 rounded-full font-bold app-primary-button disabled:opacity-50">
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
