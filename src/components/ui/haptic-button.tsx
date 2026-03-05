import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

interface HapticButtonProps extends ButtonProps {
  hapticStyle?: HapticStyle;
}

const HapticButton = React.forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ hapticStyle = 'light', onClick, className, children, ...props }, ref) => {

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      haptic(hapticStyle);
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        className={cn(
          "active:scale-[0.96] transition-all duration-150",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
HapticButton.displayName = "HapticButton";

export { HapticButton };
