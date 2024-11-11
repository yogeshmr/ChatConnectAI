import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Message } from "db/schema";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageProps {
  message: Message;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const [isExecuting, setIsExecuting] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const executeCode = async (code: string, language: string) => {
    if (language !== 'python') {
      setCodeError('Only Python code execution is supported');
      return;
    }

    setIsExecuting(true);
    setCodeOutput(null);
    setCodeError(null);

    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setCodeOutput(result.output);
        toast({
          title: "Code executed successfully",
          description: "Check the output below the code block",
        });
      } else {
        setCodeError(result.error);
        toast({
          title: "Code execution failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to execute code:', error);
      setCodeError('Failed to execute code. Please try again.');
      toast({
        title: "Error",
        description: "Failed to execute code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const CodeBlock = ({ language = "", value = "" }) => (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {language === 'python' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => executeCode(value, language)}
            disabled={isExecuting}
            className="gap-2"
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isExecuting ? "Running..." : "Run"}
          </Button>
        )}
      </div>
      <div className="relative">
        <div className="absolute top-0 right-0 px-2 py-1 text-xs text-muted-foreground rounded-bl bg-muted">
          {language}
        </div>
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            padding: '1rem',
          }}
          className="!bg-muted"
        >
          {value}
        </SyntaxHighlighter>
      </div>
      {codeOutput && (
        <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm">
          <div className="text-xs text-muted-foreground mb-1">Output:</div>
          <pre className="whitespace-pre-wrap text-green-500">{codeOutput}</pre>
        </div>
      )}
      {codeError && (
        <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm">
          <div className="text-xs text-muted-foreground mb-1">Error:</div>
          <pre className="whitespace-pre-wrap text-red-500">{codeError}</pre>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={messageRef}
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
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              if (!inline && language) {
                return (
                  <CodeBlock
                    language={language}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                );
              }

              return (
                <code className={cn(
                  "px-1 py-0.5 rounded-md",
                  inline ? "bg-muted-foreground/20" : "block my-4",
                  className
                )} {...props}>
                  {children}
                </code>
              );
            },
            p({ children }) {
              return <p className="mb-4 last:mb-0">{children}</p>;
            },
            ul({ children }) {
              return <ul className="list-disc pl-4 mb-4 last:mb-0">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal pl-4 mb-4 last:mb-0">{children}</ol>;
            },
            li({ children }) {
              return <li className="mb-2 last:mb-0">{children}</li>;
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-muted-foreground/20 pl-4 italic mb-4 last:mb-0">
                  {children}
                </blockquote>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
