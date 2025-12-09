import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  description: string;
  url?: string;
}

interface SmartSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelect?: (result: SearchResult) => void;
  className?: string;
}

const SmartSearch = ({
  placeholder = "Search...",
  onSearch,
  onSelect,
  className,
}: SmartSearchProps) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Invoice INV-2024-0847",
    "Husky Energy",
    "PO matching errors",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search results for demo
  const mockResults: SearchResult[] = [
    {
      id: "1",
      title: "Invoice INV-2024-0847",
      type: "Invoice",
      description: "Husky Energy - $45,250.00 - PO mismatch",
      url: "/invoices/INV-2024-0847",
    },
    {
      id: "2",
      title: "Validation Rule: PO Required",
      type: "Rule",
      description: "Error-level validation for PO number field",
      url: "/validation",
    },
    {
      id: "3",
      title: "Suncor Energy",
      type: "Vendor",
      description: "Active vendor - 23 pending invoices",
      url: "/vendors/suncor",
    },
  ];

  useEffect(() => {
    if (query.length > 2) {
      // Simulate API search delay
      const timer = setTimeout(() => {
        setResults(
          mockResults.filter(
            (r) =>
              r.title.toLowerCase().includes(query.toLowerCase()) ||
              r.description.toLowerCase().includes(query.toLowerCase())
          )
        );
        setIsOpen(true);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
      // Add to recent searches
      setRecentSearches((prev) => [
        searchQuery,
        ...prev.filter((s) => s !== searchQuery).slice(0, 4),
      ]);
      setIsOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    setQuery(result.title);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10"
          aria-label="Smart search"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 animate-fade-in">
          {results.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Search Results
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground group-hover:text-accent-foreground">
                        {result.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{result.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {result.type}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.length <= 2 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(search);
                    handleSearch(search);
                  }}
                  className="w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
                >
                  {search}
                </button>
              ))}
            </div>
          )}

          {query.length > 2 && results.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
