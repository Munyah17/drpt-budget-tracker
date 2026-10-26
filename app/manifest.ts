import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dr PT — Personal Budget Tracker",
    short_name: "Dr PT",
    description: "Track income, expenses and savings goals in one calm, beautiful place.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fff7fa",
    theme_color: "#c81057",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
