import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  MoreVertical, 
  Pencil, 
  Trash, 
  Search, 
  SortAsc, 
  Filter,
  Archive,
  Star
} from "lucide-react";
import type { Conversation } from "db/schema";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: number;
  onSelect: (id: number) => void;
  onUpdate: (id: number, updates: Partial<Conversation>) => Promise<void>;
  onDelete: (ids: number[]) => Promise<void>;
}

type SortOrder = "newest" | "oldest" | "alphabetical" | "lastActive";
type FilterType = "all" | "starred" | "archived";

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onUpdate,
  onDelete,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<number>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedConversations, setSelectedConversations] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (id: number, updates: Partial<Conversation>) => {
    onUpdate(id, updates);
    if (updates.title) {
      setEditingId(undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: number) => {
    if (e.key === "Enter") {
      handleUpdate(id, { title: e.currentTarget.value });
    } else if (e.key === "Escape") {
      setEditingId(undefined);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedConversations(prev => 
      prev.includes(id) 
        ? prev.filter(convId => convId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    onDelete(selectedConversations);
    setSelectedConversations([]);
  };

  const filteredAndSortedConversations = useMemo(() => {
    let filtered = conversations.filter((conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply filters
    if (filterType === "starred") {
      filtered = filtered.filter(conv => conv.starred);
    } else if (filterType === "archived") {
      filtered = filtered.filter(conv => conv.archived);
    }

    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "lastActive":
          const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          return bTime - aTime;
        default:
          return 0;
      }
    });
  }, [conversations, searchQuery, sortOrder, filterType]);

  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Earlier: [],
    };

    filteredAndSortedConversations.forEach((conv) => {
      const date = new Date(conv.createdAt);
      if (isToday(date)) {
        groups.Today.push(conv);
      } else if (isYesterday(date)) {
        groups.Yesterday.push(conv);
      } else if (isThisWeek(date)) {
        groups["This Week"].push(conv);
      } else if (isThisMonth(date)) {
        groups["This Month"].push(conv);
      } else {
        groups.Earlier.push(conv);
      }
    });

    return groups;
  }, [filteredAndSortedConversations]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred">Starred</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="archived">Archived</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <SortAsc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="alphabetical">Alphabetical</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="lastActive">Last Active</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {selectedConversations.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1 bg-accent rounded-lg">
              <span>{selectedConversations.length} selected</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}

          {Object.entries(groupedConversations).map(([group, convs]) => 
            convs.length > 0 && (
              <div key={group}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {convs.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg",
                        activeId === conversation.id && "bg-accent"
                      )}
                    >
                      <Checkbox
                        checked={selectedConversations.includes(conversation.id)}
                        onCheckedChange={() => toggleSelection(conversation.id)}
                        className="ml-2"
                      />
                      
                      {editingId === conversation.id ? (
                        <div className="flex-1 p-2">
                          <Input
                            ref={inputRef}
                            defaultValue={conversation.title}
                            onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                            onBlur={(e) => handleUpdate(conversation.id, { title: e.target.value })}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start gap-2 h-auto py-2"
                            onClick={() => onSelect(conversation.id)}
                          >
                            <MessageSquare className="h-4 w-4 shrink-0" />
                            <span className="truncate">{conversation.title}</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingId(conversation.id)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => 
                                  handleUpdate(conversation.id, { starred: !conversation.starred })
                                }
                              >
                                <Star className={cn(
                                  "mr-2 h-4 w-4",
                                  conversation.starred && "fill-current"
                                )} />
                                {conversation.starred ? "Unstar" : "Star"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => 
                                  handleUpdate(conversation.id, { archived: !conversation.archived })
                                }
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                {conversation.archived ? "Unarchive" : "Archive"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete([conversation.id])}
                                className="text-red-600"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
