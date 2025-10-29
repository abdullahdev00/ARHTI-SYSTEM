import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockUserData = {
  fullName: "Muhammad Ali",
  email: "muhammad.ali@business.pk",
  phone: "+92 300 1234567",
  businessName: "Ali Trading Company",
};

export function UserProfile() {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          data-testid="user-profile-button"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(mockUserData.fullName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 rounded-2xl" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3 py-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(mockUserData.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-semibold" data-testid="text-user-fullname">{mockUserData.fullName}</p>
                <p className="text-xs text-muted-foreground" data-testid="text-user-business">{mockUserData.businessName}</p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-user-email">{mockUserData.email}</span>
          </div>
          <div className="flex items-center gap-3 px-2 py-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-user-phone">{mockUserData.phone}</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
