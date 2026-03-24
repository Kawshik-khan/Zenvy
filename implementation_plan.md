# Global App Interactive Logic & Database Schema

The goal is to seamlessly wire up **every visual button, 3-dot menu, and interaction** across the entire application to a real backend database. Since you plan on migrating to Supabase (PostgreSQL) later, defining these models now in Prisma ensures a flawless transition.

## Proposed Database Schema Expansion (Prisma)

To support the UI designs (Dashboard, Groups, Scheduling, Chat, Matching), we will inject the following models into [prisma/schema.prisma](file:///d:/Softwear%20project/peerly/Zenvy/prisma/schema.prisma):

### 1. Study Groups & Memberships
Supports the `/groups` page, "Create Group", "Join", and "Leave" buttons.
```prisma
model StudyGroup {
  id          String        @id @default(cuid())
  name        String
  description String?
  subject     String?
  avatar      String?
  adminId     String
  admin       User          @relation("GroupAdmin", fields: [adminId], references: [id])
  members     GroupMember[]
  messages    GroupMessage[]
  events      Event[]
  createdAt   DateTime      @default(now())
}

model GroupMember {
  id        String     @id @default(cuid())
  groupId   String
  userId    String
  role      String     @default("MEMBER") // ADMIN, MEMBER
  group     StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt  DateTime   @default(now())
  
  @@unique([groupId, userId])
}
```

### 2. Events & Scheduling
Supports the `/scheduling` page, calendar components, and "RSVP / Join Event" buttons.
```prisma
model Event {
  id          String          @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  location    String?
  type        String          @default("VIRTUAL")
  creatorId   String
  creator     User            @relation("EventCreator", fields: [creatorId], references: [id])
  groupId     String?
  group       StudyGroup?     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  attendees   EventAttendee[]
  createdAt   DateTime        @default(now())
}

model EventAttendee {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  status    String   @default("GOING") // GOING, MAYBE, DECLINED
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, userId])
}
```

### 3. Group Messaging
Supports the `/chat` page specifically for community/group channels.
```prisma
model GroupMessage {
  id        String     @id @default(cuid())
  content   String
  senderId  String
  groupId   String
  sender    User       @relation(fields: [senderId], references: [id], onDelete: Cascade)
  group     StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())
}
```

### 4. Notifications & Three-Dot Menu Actions
Supports "Block User", "Report", "Accept Match Request", and global notification bells.
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // MATCH_REQUEST, GROUP_INVITE, SYSTEM
  content   String
  read      Boolean  @default(false)
  relatedId String?  // ID of the group/match
  createdAt DateTime @default(now())
}

model UserBlock {
  id        String   @id @default(cuid())
  blockerId String
  blockedId String
  createdAt DateTime @default(now())
  @@unique([blockerId, blockedId])
}

model Report {
  id         String   @id @default(cuid())
  reporterId String
  reportedId String
  reason     String
  status     String   @default("PENDING")
  createdAt  DateTime @default(now())
}
```

---

## Action Plan (Component Wiring)

Once the database schema is pushed, I will execute the following logic implementations:

1. **Dashboard (`/dashboard`)**:
   - Wire up "Upcoming Events" to fetch from the `Event` table.
   - Wire up "Active Study Groups" to fetch from `GroupMember`.
2. **Groups (`/groups`)**:
   - Implement the "Create Group" button logic with a server action.
   - Make the "Join" button create a `GroupMember` record.
   - Wire the 3-dot menu to allow Admins to "Edit" or "Delete" groups, and Users to "Leave".
3. **Matching (`/matching`)**:
   - "Add to Group" button will dispatch a `Notification` invite to the target user.
   - "Open Requests" will actively query `Notification` and `Match` models.
4. **Chat (`/chat`)**:
   - Differentiate UI fetching between Direct Messages (`ChatRoom`) and Group Channels (`StudyGroup`).
5. **Universal Three-Dot Menus**:
   - Throughout the app, clicking a user's 3-dot menu will trigger "Block User" or "Report User" API routes hooking into the `UserBlock` and `Report` tables.

## User Review Required
> [!IMPORTANT]
> Please review the comprehensive Database Schema and wiring plan above. If this completely satisfies your vision for connecting the UI to data, **approve the plan** so I can generate the database tables and start writing the backend communication code!
