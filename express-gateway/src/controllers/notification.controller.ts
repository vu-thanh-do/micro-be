import { Request, Response } from "express";
import { httpClient } from "../utils/httpClient";
import { config } from "../config";

export const proxyServiceNotification = async (req: Request, res: Response) => {
  try {
    const data = await httpClient({
      method: "GET",
      url: `${config.services.serviceA}/data`,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};
