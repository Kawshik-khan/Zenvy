"use client";

import { Users } from "lucide-react";
import { Avatar, Badge, Button, Sheet, SheetContent, SheetTrigger } from "@/components/ui";

type Member = { id: string; name: string; image: string | null; role: string };

type MembersSheetProps = {
  members: Member[];
  /** Roles that get a badge, mapped to the label shown, e.g. { ADMIN: "Admin" }. */
  roleLabels: Record<string, string>;
  title: string;
};

/** Member list in a side sheet, so it works on a phone as well as a desktop. */
export function MembersSheet({ members, roleLabels, title }: MembersSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" icon={<Users size={18} />} aria-label={`${members.length} members`}>
          {members.length}
        </Button>
      </SheetTrigger>
      <SheetContent title={title} description={`${members.length} ${members.length === 1 ? "person" : "people"}`}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 rounded-nb border-2 border-line bg-card p-2.5">
              <Avatar name={member.name} src={member.image} size="sm" />
              <span className="min-w-0 flex-1 truncate font-grotesk font-bold text-fg">{member.name}</span>
              {roleLabels[member.role] && (
                <Badge tone="focus" size="sm">
                  {roleLabels[member.role]}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
