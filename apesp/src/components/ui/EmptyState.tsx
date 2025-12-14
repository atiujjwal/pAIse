"use client";
import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  message,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-border bg-accent/20">
      {Icon && (
        <div className="mb-4 p-3 bg-background rounded-full shadow-sm border border-border">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-bold text-foreground mb-2">
        {title || "No items found"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        {description ||
          message ||
          "It's empty here. Try creating something new."}
      </p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
