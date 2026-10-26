import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Download, Paperclip, Send } from "lucide-react-native";
import type { ChatMessage } from "../data/types";
import { person } from "../data/sample";
import { font, palette } from "../theme/tokens";
import { useVolume } from "../theme/volume";
import { notify } from "../lib/dialog";
import { Avatar, IconButton } from "./controls";
import { Text } from "./Text";

const kindFill = { PDF: palette.alert, IMG: palette.career, CPP: palette.live, LINK: palette.focus } as const;

export function Bubble({ message, showAuthor }: { message: ChatMessage; showAuthor?: boolean }) {
  const v = useVolume();
  const mine = message.authorId === "me";
  const author = person(message.authorId);

  if (message.system) {
    return (
      <Text variant="small" muted style={{ alignSelf: "center", fontSize: 12 }}>
        {message.text}
      </Text>
    );
  }

  const shape = mine ? { borderTopLeftRadius: 14, borderTopRightRadius: 4, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 } : { borderTopLeftRadius: 4, borderTopRightRadius: 14, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 };
  const box = { borderWidth: v.border, borderColor: v.line, backgroundColor: mine ? palette.chat : v.card, ...shape };

  let content;
  if (message.file) {
    content = (
      <View style={[box, { width: 250, flexDirection: "row", alignItems: "center", gap: 10, padding: 10 }]}>
        <View style={{ width: 40, height: 44, borderRadius: 6, borderWidth: 2, borderColor: v.line, backgroundColor: kindFill[message.file.kind], alignItems: "center", justifyContent: "center" }}>
          <Text variant="mono" style={{ fontSize: 10 }}>
            {message.file.kind}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="h3" numberOfLines={1} style={{ fontSize: 14 }}>
            {message.file.name}
          </Text>
          <Text variant="small" muted style={{ fontSize: 12 }}>
            {message.file.size}
          </Text>
        </View>
        <IconButton icon={Download} label={`Download ${message.file.name}`} shadow={false} onPress={() => notify("Download", "Files open once chat attachments are connected to storage.")} />
      </View>
    );
  } else if (message.notes) {
    content = (
      <View style={[box, { padding: 12, backgroundColor: "#fffdf8" }]}>
        <Text variant="label">{message.notes.title}</Text>
        {message.notes.items.map((it) => (
          <Text key={it} variant="small" style={{ fontSize: 14, lineHeight: 21 }}>
            • {it}
          </Text>
        ))}
      </View>
    );
  } else {
    content = (
      <View style={[box, { paddingHorizontal: 13, paddingVertical: 10 }]}>
        <Text variant="body" style={{ fontSize: 15, lineHeight: 21 }}>
          {message.text}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 10, alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%" }} accessible accessibilityLabel={`${mine ? "You" : author.name}, ${message.time}: ${message.text ?? message.file?.name ?? message.notes?.items.join(". ")}`}>
      {showAuthor && !mine ? <Avatar initials={author.initials} color={author.color} size={34} /> : null}
      <View style={{ flexShrink: 1, alignItems: mine ? "flex-end" : "flex-start" }}>
        {showAuthor && !mine ? (
          <Text variant="h3" style={{ fontSize: 13, marginBottom: 3 }}>
            {author.name}{" "}
            <Text variant="mono" muted style={{ fontSize: 10, fontFamily: font.mono }}>
              {message.time}
            </Text>
          </Text>
        ) : null}
        {content}
        {!showAuthor || mine ? (
          <Text variant="mono" muted style={{ fontSize: 10, marginTop: 3, fontFamily: font.mono }}>
            {message.time}
            {mine ? " · Sent" : ""}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

type LiveMessage = { id: string; content: string; senderName: string; status: string; timestamp: string; fileName: string | null; fileUrl: string | null; pending?: boolean; failed?: boolean };

export function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** A message from the server (live mode). */
export function LiveBubble({ message, mine, onRetry }: { message: LiveMessage; mine: boolean; onRetry?: () => void }) {
  const v = useVolume();
  const deleted = message.status === "DELETED";
  const text = deleted ? "Message deleted" : message.content || message.fileName || "Attachment";
  const shape = mine ? { borderTopLeftRadius: 14, borderTopRightRadius: 4, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 } : { borderTopLeftRadius: 4, borderTopRightRadius: 14, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 };
  const state = message.failed ? "Not sent" : message.pending ? "Sending…" : mine ? "Sent" : "";
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%", alignItems: mine ? "flex-end" : "flex-start" }} accessible accessibilityLabel={`${mine ? "You" : message.senderName}, ${formatTime(message.timestamp)}: ${text}${state ? `. ${state}` : ""}`}>
      <View style={[{ borderWidth: v.border, borderColor: message.failed ? palette.alert : v.line, backgroundColor: mine ? palette.chat : v.card, paddingHorizontal: 13, paddingVertical: 10, opacity: message.pending ? 0.7 : 1 }, shape]}>
        <Text variant="body" muted={deleted} style={{ fontSize: 15, lineHeight: 21, fontStyle: deleted ? "italic" : "normal" }}>
          {text}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text variant="mono" muted style={{ fontSize: 10, marginTop: 3, fontFamily: font.mono }}>
          {formatTime(message.timestamp)}
          {state ? ` · ${state}` : ""}
        </Text>
        {message.failed && onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry sending" style={{ minHeight: 32, justifyContent: "center" }}>
            <Text variant="mono" style={{ fontSize: 11, textDecorationLine: "underline" }}>
              Retry
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function TypingIndicator({ name }: { name: string }) {
  const v = useVolume();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: "row", gap: 3, paddingHorizontal: 10, paddingVertical: 8, borderWidth: v.border, borderColor: v.line, borderRadius: 99, backgroundColor: v.card }}>
        {[1, 0.6, 0.3].map((o) => (
          <View key={o} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: v.line, opacity: o }} />
        ))}
      </View>
      <Text variant="small" muted style={{ fontSize: 12 }}>
        {name} is typing
      </Text>
    </View>
  );
}

export function Composer({ placeholder, onSend, onTyping }: { placeholder: string; onSend: (text: string) => void; onTyping?: () => void }) {
  const v = useVolume();
  const [draft, setDraft] = useState("");
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, backgroundColor: v.card, borderTopWidth: v.border, borderColor: v.line }}>
      {/* Attachments go through app/actions/upload-chat-attachment.ts on the web; needs expo-document-picker here. */}
      <IconButton icon={Paperclip} label="Attach a file" onPress={() => notify("Attach a file", "Attachments need expo-document-picker and the upload endpoint.")} />
      <TextInput
        value={draft}
        onChangeText={(t) => {
          setDraft(t);
          if (t) onTyping?.();
        }}
        onSubmitEditing={send}
        placeholder={placeholder}
        placeholderTextColor={v.fgMuted}
        accessibilityLabel="Message"
        returnKeyType="send"
        blurOnSubmit={false}
        style={{ flex: 1, minWidth: 0, minHeight: 48, borderWidth: v.border, borderColor: v.line, borderRadius: 10, backgroundColor: palette.white, paddingHorizontal: 14, fontFamily: font.medium, fontSize: 16, color: v.fg }}
      />
      <Pressable
        onPress={send}
        disabled={!draft.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send"
        accessibilityState={{ disabled: !draft.trim() }}
        style={{ width: 48, height: 48, borderRadius: 10, borderWidth: v.border, borderColor: v.line, backgroundColor: draft.trim() ? palette.chat : v.canvas, alignItems: "center", justifyContent: "center" }}
      >
        <Send size={20} color={v.fg} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}
