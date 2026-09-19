import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui";
export default function NotFound() {
  return (
    <div className="container-app grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <div className="font-display text-8xl font-extrabold text-heritage-sand">
          404
        </div>
        <h1 className="mt-3 text-3xl font-extrabold">This trail ends here.</h1>
        <p className="mt-2 text-slate-500">
          The page you’re looking for isn’t part of the current Heritage Quest
          map.
        </p>
        <Button as={Link} to="/" className="mt-6">
          <ArrowLeft className="h-4 w-4" /> Back Home
        </Button>
      </div>
    </div>
  );
}
