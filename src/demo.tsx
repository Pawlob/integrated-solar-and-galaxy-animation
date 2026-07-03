'use client'

import React, { useState, useRef, useEffect } from "react";
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
 
export function SplineSceneBasic() {
  const [password, setPassword] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Simulate cursor movement when typing in the password field
  useEffect(() => {
    if (isPasswordFocused && passwordInputRef.current) {
      const rect = passwordInputRef.current.getBoundingClientRect();
      
      // Calculate fake cursor position
      // Start at the left edge of the input and move right as password grows
      const xOffset = Math.min(password.length * 8, rect.width - 20);
      const fakeCursorX = rect.left + xOffset;
      const fakeCursorY = rect.top + rect.height / 2;

      // Dispatch a pointermove event to trick Spline into looking at the input
      const event = new PointerEvent("pointermove", {
        clientX: fakeCursorX,
        clientY: fakeCursorY,
        bubbles: true,
        cancelable: true,
        pointerType: "mouse",
      });
      
      document.body.dispatchEvent(event);
    }
  }, [password, isPasswordFocused]);

  // When focus is lost, we could optionally reset the view, 
  // but the user's real mouse will naturally take over.

  return (
    <div className="w-full min-h-screen flex items-center justify-center md:justify-end p-4 md:p-12 md:pr-24 relative">
      {/* Full screen Spline background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full pointer-events-auto mr-0 pl-[1px] -ml-[250px]"
        />
      </div>

      {/* Login Card on the right */}
      <Card className="w-full max-w-lg bg-black/[0.96] relative z-20 border-neutral-800 shadow-2xl">
        <div className="p-10 md:p-12 flex flex-col justify-center">
          <div className="w-full mx-auto space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                እንኳን በደህና ተመለሱ
              </h1>
              <p className="text-neutral-400 text-base">
                መለያዎን ለመክፈት እባክዎ መለያ መረጃዎን ያስገቡ
              </p>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">ኢሜይል</Label>
                <Input id="email" type="email" placeholder="m@example.com" required className="h-11" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">የይለፍ ቃል</Label>
                  <a href="#" className="text-sm text-neutral-400 hover:text-neutral-300 transition-colors">
                    የይለፍ ቃል ረስተዋል?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  ref={passwordInputRef}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold">
                ይግቡ
              </Button>
            </div>
            
            <div className="text-center text-sm text-neutral-400 pt-2">
              መለያ የለዎትም?{" "}
              <a href="#" className="text-neutral-300 hover:text-white underline underline-offset-4 transition-colors">
                ይመዝገቡ
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
