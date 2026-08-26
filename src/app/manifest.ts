import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MasteryOS Math",
    short_name: "MasteryOS Math",
    description: "Haim's Year 6 mathematics learning companion",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f0e5",
    theme_color: "#10211f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}