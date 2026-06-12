"use client";

import { MessageCircle, User } from "lucide-react";

import type { ChatMessage } from "@/lib/platform-types";
import { cn } from "@/lib/utils";

export function ScenarioChatPanel({
  messages,
  title = "Chat",
}: {
  messages: ChatMessage[];
  title?: string;
}) {
  return (
    <div className="rounded-lg border bg-[#E8E8ED] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
        <MessageCircle className="size-4" />
        {title}
      </div>
      <div className="max-h-[400px] space-y-3 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={`${msg.sender}-${index}-${msg.message.slice(0, 12)}`}
            className={cn(
              "flex gap-2",
              msg.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.sender === "other" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EC4899] text-white">
                <User className="size-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                msg.sender === "user"
                  ? "rounded-br-md bg-[#EC4899] text-white"
                  : "rounded-bl-md bg-white text-foreground shadow-sm"
              )}
            >
              {msg.sender === "other" && (
                <p className="mb-0.5 text-xs font-semibold text-[#EC4899]">
                  {msg.name}
                </p>
              )}
              <p>{msg.message}</p>
              {msg.timestamp && (
                <p
                  className={cn(
                    "mt-1 text-right text-[10px]",
                    msg.sender === "user"
                      ? "text-white/70"
                      : "text-muted-foreground"
                  )}
                >
                  {msg.timestamp}
                </p>
              )}
            </div>
            {msg.sender === "user" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <User className="size-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}