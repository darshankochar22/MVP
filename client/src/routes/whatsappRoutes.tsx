import WhatsAppWorkspace from "../pages/whatsapp/WhatsAppWorkspace";
import type { RouteConfig } from "./types";

export const whatsappRoutes: RouteConfig[] = [
  { path: "/whatsapp", element: <WhatsAppWorkspace /> },
  { path: "/whatsapp/:tab", element: <WhatsAppWorkspace /> },
];
