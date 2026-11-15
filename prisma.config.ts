// @ts-ignore — Prisma 8.x platform CLI config, types not bundled with prisma@5
import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});
