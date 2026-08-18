import { useState } from "react";
import { Check, ChevronsUpDown, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Customer, useCustomers } from "@/hooks/useCustomers";

interface CustomerPickerProps {
  value?: string | null;
  onSelect: (customer: Customer) => void;
  onClear?: () => void;
}

export const CustomerPicker = ({ value, onSelect, onClear }: CustomerPickerProps) => {
  const [open, setOpen] = useState(false);
  const { data: customers = [], isLoading } = useCustomers();

  const selected = customers.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <UserRound className="h-4 w-4 shrink-0 opacity-60" />
            {selected
              ? `${selected.name}${selected.boat_name ? ` — ${selected.boat_name}` : ""}`
              : "Select a returning customer (optional)"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput placeholder="Search customers..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading..." : "No saved customers yet."}
            </CommandEmpty>
            <CommandGroup>
              {selected && onClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onClear();
                    setOpen(false);
                  }}
                >
                  Clear selection
                </CommandItem>
              )}
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.name} ${customer.boat_name} ${customer.phone}`}
                  onSelect={() => {
                    onSelect(customer);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected?.id === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[customer.boat_name, customer.phone].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
