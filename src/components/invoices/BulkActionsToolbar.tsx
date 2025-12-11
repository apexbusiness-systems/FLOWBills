import * as React from "react";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Download, 
  Send,
  MoreHorizontal,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onExport: () => void;
  onSend: () => void;
  onClearSelection: () => void;
  disabled?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  onApprove,
  onReject,
  onDelete,
  onExport,
  onSend,
  onClearSelection,
  disabled = false
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-background border-2 rounded-lg shadow-2xl p-3 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 border-r">
            <Badge variant="secondary" className="font-mono">
              {selectedCount}
            </Badge>
            <span className="text-sm font-medium">selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onApprove}
              disabled={disabled}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={disabled}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              disabled={disabled}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSend}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Vendor
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="border-l pl-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
