import { MobileNav } from "../mobile-nav";

export default function MobileNavExample() {
  return (
    <div className="h-screen bg-background relative">
      <div className="p-4">
        <p className="text-muted-foreground">Mobile navigation appears at the bottom</p>
      </div>
      <MobileNav />
    </div>
  );
}
