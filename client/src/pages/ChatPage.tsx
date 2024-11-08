import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
import { useChat } from "../hooks/use-chat";
import ChatHeader from "../components/ChatHeader";
import ConversationList from "../components/ConversationList";
import Message from "../components/Message";
import ChatInput from "../components/ChatInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: userLoading } = useUser();
  const { 
    messages, 
    conversations,
    activeConversationId,
    isLoading,
    createConversation,
    sendMessage,
    selectConversation
  } = useChat();

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    }
  }, [user, userLoading, setLocation]);

  if (userLoading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r">
        <div className="p-4">
          <Button
            className="w-full"
            onClick={() => createConversation()}
          >
            New Chat
          </Button>
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={selectConversation}
          />
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="animate-pulse text-muted-foreground">
                OpenAI is thinking...
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 max-w-3xl mx-auto w-full">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
