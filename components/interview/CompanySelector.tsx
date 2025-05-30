// components/interview/CompanySelector.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// First, install the required components
// npx shadcn-ui add badge command popover

export type Company = {
  id: string;
  name: string;
  logo?: string;
};

const companies: Company[] = [
  { id: "google", name: "Google" },
  { id: "amazon", name: "Amazon" },
  { id: "meta", name: "Meta" },
  { id: "microsoft", name: "Microsoft" },
  { id: "apple", name: "Apple" },
  { id: "netflix", name: "Netflix" },
  { id: "uber", name: "Uber" },
  { id: "airbnb", name: "Airbnb" },
  { id: "tesla", name: "Tesla" },
  { id: "linkedin", name: "LinkedIn" },
];

interface CompanySelectorProps {
  selectedCompanies: Company[];
  setSelectedCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
}

export function CompanySelector({
  selectedCompanies,
  setSelectedCompanies,
}: CompanySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (company: Company) => {
    setSelectedCompanies((current) => {
      const isSelected = current.some((item) => item.id === company.id);

      if (isSelected) {
        return current.filter((item) => item.id !== company.id);
      }

      return [...current, company];
    });
  };

  const handleRemove = (companyId: string) => {
    setSelectedCompanies((current) =>
      current.filter((item) => item.id !== companyId)
    );
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-12 py-2"
          >
            <div className="flex flex-wrap gap-2 items-center">
              {selectedCompanies.length > 0 ? (
                selectedCompanies.map((company) => (
                  <Badge key={company.id} variant="secondary" className="mr-1">
                    {company.name}
                    <span
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-destructive/10 p-0.5"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(company.id);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(company.id);
                      }}
                      aria-label={`Remove ${company.name}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  Select companies...
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search companies..." />
            <CommandEmpty>No company found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {companies.map((company) => {
                const isSelected = selectedCompanies.some(
                  (item) => item.id === company.id
                );

                return (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => handleSelect(company)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {company.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
