"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple"; collapsible?: boolean }
>(({ className, ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    // Simple state for open/close is handled by parent in Radix, but here we might need a simpler approach 
    // or just rely on the user clicking.
    // Wait, to make this work like Radix without Radix, I need context.
    // For now, let's make it a simple uncontrolled component per item using <details> styled to look like Accordion.
    // Actually, the manual page uses it as: <Accordion type="single" collapsible> ... <AccordionItem value="..."> ... </AccordionItem>

    // Let's implement a Context to handle the state if we want to support "single" type properly.
    // But for the manual page, a simple independent toggle is probably fine if we don't strictly enforce "one open at a time".

    return (
        <h3 className="flex">
            <button
                ref={ref}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
        </h3>
    )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
))
AccordionContent.displayName = "AccordionContent"

// Re-implementing properly with Context to manage open state
const AccordionContext = React.createContext<{
    value?: string | string[];
    onValueChange?: (value: string) => void;
}>({});

const AccordionItemContext = React.createContext<{ value: string }>({ value: "" });

const AccordionImpl = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { type?: "single" | "multiple"; collapsible?: boolean; defaultValue?: string; value?: string; onValueChange?: (value: string) => void }
>(({ className, type, value: valueProp, onValueChange, children, ...props }, ref) => {
    const [value, setValue] = React.useState<string | string[]>(valueProp || (type === 'multiple' ? [] : ''));

    const handleValueChange = (itemValue: string) => {
        if (type === "single") {
            setValue(prev => prev === itemValue ? "" : itemValue);
        } else {
            // Multiple support omitted for brevity as not used in manual
        }
    }

    return (
        <AccordionContext.Provider value={{ value: (valueProp !== undefined ? valueProp : value), onValueChange: handleValueChange }}>
            <div ref={ref} className={className} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    )
})

const AccordionTriggerImpl = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);
    const isOpen = selectedValue === itemValue;

    return (
        <h3 className="flex">
            <button
                ref={ref}
                type="button"
                onClick={(e) => {
                    onValueChange?.(itemValue);
                    onClick?.(e);
                }}
                className={cn(
                    "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
                    className
                )}
                {...props}
            >
                {children}
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>
        </h3>
    )
})

const AccordionContentImpl = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value: selectedValue } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);
    const isOpen = selectedValue === itemValue;

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className={cn("overflow-hidden text-sm animate-fade-in", className)}
            {...props}
        >
            <div className={cn("pb-4 pt-0", className)}>{children}</div>
        </div>
    )
})

const AccordionItemImpl = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
    <AccordionItemContext.Provider value={{ value }}>
        <div ref={ref} className={cn("border-b", className)} {...props} />
    </AccordionItemContext.Provider>
))


export { AccordionImpl as Accordion, AccordionItemImpl as AccordionItem, AccordionTriggerImpl as AccordionTrigger, AccordionContentImpl as AccordionContent }
