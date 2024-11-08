import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "db/schema";

interface MessageProps {
  message: Message;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-4 py-4",
        isUser && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8">
        <span className="text-xs">
          {isUser ? "You" : "AI"}
        </span>
      </Avatar>
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
