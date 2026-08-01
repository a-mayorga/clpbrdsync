import { Test, type TestingModule } from "@nestjs/testing";

import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get(HealthController);
  });

  describe("getHealth", () => {
    it("returns the backend health status", () => {
      expect(controller.getHealth()).toEqual({
        status: "ok",
        service: "clpbrdsync-backend",
      });
    });
  });
});
