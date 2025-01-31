import React from 'react';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import { Button } from '../ui/button';
import { ShoppingCart, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Shop</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 w-[400px] grid-cols-2">
                    <li>
                      <NavigationMenuLink href="/products/electronics">
                        <div className="font-medium">Electronics</div>
                        <p className="text-sm text-muted-foreground">
                          Latest gadgets and electronics
                        </p>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="/products/clothing">
                        <div className="font-medium">Clothing</div>
                        <p className="text-sm text-muted-foreground">
                          Fashion and accessories
                        </p>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/deals">
                  Deals
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <h2 className="font-semibold text-lg">Shopping Cart</h2>
                  <Separator className="my-4" />
                  <ScrollArea className="flex-1">
                    {/* Cart items will go here */}
                  </ScrollArea>
                  <div className="mt-auto">
                    <Separator className="my-4" />
                    <div className="flex justify-between mb-4">
                      <span>Total</span>
                      <span>$0.00</span>
                    </div>
                    <Button className="w-full">
                      Checkout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {children}
      </main>

      <footer className="border-t">
        <div className="container py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Our Store. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 