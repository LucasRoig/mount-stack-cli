import { Button } from "@lro-ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Routes } from "@/routes";

export function NotFound() {
  return (
    <div className="h-full flex justify-center items-center text-center">
      <div className="space-y-4">
        <p>404 - Not Found</p>
        <Button asChild>
          <Link href={Routes.homepage}>
            <ArrowLeft />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
