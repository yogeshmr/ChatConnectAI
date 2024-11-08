import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import type { Conversation } from "db/schema";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: number;
  onSelect: (id: number) => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-2 space

-y-1">
        {conversations.map((conversation) => (
          <Button
            key={conversation.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              activeId === conversation.id && "bg-accent"
            )}
            onClick={() => onSelect(conversation.id)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="truncate">{conversation.title}</span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
